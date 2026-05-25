# Upstash Redis setup - cache, BullMQ, Socket.IO adapter

The API uses Upstash Redis for three things:

1. **Cache + sessions** (auth, permissions, dispatcher dedupe).
2. **BullMQ queues** (notifications, geofence events).
3. **Socket.IO Redis adapter** (multi-instance pub/sub).

All three share a single `REDIS_URL`. TLS is mandatory.

## 1. Create the database

1. Sign in at <https://upstash.com>.
2. **Create Database** -> Type: **Redis**.
3. Region: choose the same region as your Railway service.
4. Eviction: **noeviction** (BullMQ requires this - random eviction
   would silently drop queue jobs).
5. Tier: free is fine for MVP (10k commands/day, 256MB).
6. **Enable TLS** - leave the default `Yes`.

## 2. Collect the connection string

Database -> Details -> **TLS** tab -> **Endpoint - rediss://**.

```
rediss://default:<TOKEN>@<NAME>.upstash.io:6379
```

- Scheme **must** be `rediss://` (TLS). Plain `redis://` is rejected by
  Joi (`scheme: [/rediss?/]`) and would not work over Upstash anyway.
- The password is URL-encoded by Upstash; `parseRedisUrl()` in
  `services/api/src/common/utils/redis-connection.util.ts` decodes it
  back before handing it to ioredis. Do not double-encode.
- Use the **non-pooling** endpoint for BullMQ. Upstash's REST endpoint
  (`https://...upstash.io`) is for HTTP-only clients and won't work
  with ioredis.

## 3. ioredis options (already configured)

`parseRedisUrl()` produces these options:

```
host:                <name>.upstash.io
port:                6379
username:            'default'
password:            <decoded token>
tls:                 {}                 # enabled because scheme is rediss://
maxRetriesPerRequest:null               # required by BullMQ
enableReadyCheck:    false              # also required by BullMQ
connectTimeout:      10000
retryStrategy:       backoff up to 3s
```

You should never need to override these.

## 4. BullMQ compatibility

- `maxRetriesPerRequest: null` and `enableReadyCheck: false` are
  mandatory. Upstash terminates idle connections; without these BullMQ
  reconnects forever instead of routing the next job through.
- Default queue prefix is `bull:` (BullMQ default). Free tier 10k
  commands/day is enough for low-volume MVP traffic. If you exceed it,
  BullMQ jobs silently stall.
- The worker service shares the same `REDIS_URL` as the API.

## 5. Socket.IO Redis adapter

`services/api/src/tracking/adapters/redis-io.adapter.ts` opens two
ioredis clients (`pubClient` and `subClient = pubClient.duplicate()`)
using the same connection options. Each instance pings both before
emitting, so a healthy `/api/v1/health/ready` implies the adapter
works. If you scale to >1 API replica, the adapter forwards events
between them automatically.

## 6. Verify

From your laptop (requires `redis-cli` with TLS support):

```bash
redis-cli --tls -u "rediss://default:<TOKEN>@<NAME>.upstash.io:6379" PING
# -> PONG
```

After deploying:

```bash
API_URL=https://your-api.up.railway.app pnpm validate:live
# expects "redis ok" in the readiness output
```

## 7. Troubleshooting

| Symptom                                              | Fix                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `WRONGPASS invalid username-password pair`           | Token contains URL-unsafe characters and was double-encoded. Recopy from Upstash and avoid manual encoding. |
| `Connection is closed.` repeating in logs            | Wrong scheme (`redis://`). Switch to `rediss://`.                                                    |
| `BullMQ: Missing maxRetriesPerRequest`               | Stop importing your own ioredis options - use `parseRedisUrl()`.                                     |
| Random `ECONNRESET`                                  | Upstash terminates idle connections. The configured `retryStrategy` reconnects automatically; if it loops, check your Upstash quota. |
| Queues stuck / never processed                       | Either eviction is set to something other than `noeviction`, or you've hit the daily command quota.   |
| `OOM command not allowed when used memory > 'maxmemory'` | Upgrade tier or purge old jobs - `BullMQ` keeps completed jobs by default.                          |
| Socket.IO works on 1 replica, fails when scaled out  | Redis adapter not initialised - check the `RedisIoAdapter` logs for `pub/sub ping ok`.                |
| Health says `redis degraded`                         | Run the `redis-cli PING` step above with the same URL the API service has.                            |
