# NGINX Reference Config

Used for **AWS ALB** or self-hosted deployments — not required for Railway/Vercel MVP (they terminate TLS).

See [`nginx.conf`](./nginx.conf) for:

- API reverse proxy
- Socket.IO WebSocket upgrade
- Security headers
- Health check passthrough

When migrating to ECS, attach this config to an sidecar NGINX container or use ALB native WebSocket support.
