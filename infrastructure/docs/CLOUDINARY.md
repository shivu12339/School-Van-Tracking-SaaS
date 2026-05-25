# Cloudinary Media Strategy

## Use cases

- School logos
- Driver profile photos
- Student photos

## Folder organization

```
schoolvan/{env}/schools/{schoolId}/{resourceId}/
schoolvan/{env}/drivers/{schoolId}/{driverId}/
schoolvan/{env}/students/{schoolId}/{studentId}/
```

Implemented in `MediaService.buildFolderPath()`.

## Upload strategy (MVP)

1. **Signed uploads** from admin dashboard (recommended).
2. Backend returns folder + upload preset metadata.
3. Client uploads directly to Cloudinary — API never handles binary bodies.

## Environment variables

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=schoolvan/production
```

## Security

- Restrict upload preset to image types + max size.
- Serve via HTTPS CDN URLs with `secure: true`.
- Tenant-scoped folders prevent cross-school leakage.

## AWS migration

Replace `MediaService` implementation with **S3 presigned PUT** + CloudFront URLs.  
Keep the same interface — minimal domain code changes.

## Backup

- Cloudinary retains assets; export manifest periodically.
- Critical assets: replicate to S3 during AWS migration.
