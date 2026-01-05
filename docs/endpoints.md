# API Endpoints

Base URL (dev): `http://localhost:3001`  
Auth: Bearer Cognito ID token in `Authorization: Bearer <token>` header.  
tRPC calls are invoked as `/trpc/{router.procedure}`. Queries use `GET` with `input=` query param; mutations use `POST` with JSON body.

## Health
- `GET /health` – health check (no auth).

## tRPC Routers & Procedures

### clients
- `GET /trpc/clients.getAll`
- `GET /trpc/clients.getAllNotEndedYet`
- `GET /trpc/clients.getAllWithMagService`
- `GET /trpc/clients.getById`
- `POST /trpc/clients.end`
- `POST /trpc/clients.create`
- `POST /trpc/clients.createInfoEntry`
- `POST /trpc/clients.update`
- `POST /trpc/clients.delete`
- `POST /trpc/clients.updateName`
- `POST /trpc/clients.updateCustomId`
- `POST /trpc/clients.updatePostCode`

### packages
- `GET /trpc/packages.getAll`
- `GET /trpc/packages.getAllWithoutInfoNotEndedYet`
- `GET /trpc/packages.getAllInfo`
- `GET /trpc/packages.getAllWithoutInfo`
- `GET /trpc/packages.getById`
- `POST /trpc/packages.create`
- `POST /trpc/packages.createSole`
- `POST /trpc/packages.update`
- `POST /trpc/packages.renew`
- `POST /trpc/packages.addCoverPeriod`
- `POST /trpc/packages.delete`
- `POST /trpc/packages.end`

### requests
- `GET /trpc/requests.getAllWithoutInfoWithPackages`
- `GET /trpc/requests.getAllWithoutInfoNotEndedYetWithPackages`
- `GET /trpc/requests.getAllInfoMetadata`
- `GET /trpc/requests.getAllMetadataWithoutInfo`
- `GET /trpc/requests.getAllMetadataWithoutInfoNotEndedYet`
- `GET /trpc/requests.getById`
- `GET /trpc/requests.getRequestWithOnePackageByPackageId`
- `POST /trpc/requests.create`
- `POST /trpc/requests.update`
- `POST /trpc/requests.renew`
- `POST /trpc/requests.endRequestAndPackages`
- `POST /trpc/requests.delete`

### volunteers
- `GET /trpc/volunteers.getAll`
- `GET /trpc/volunteers.getAllNotEndedYet`
- `GET /trpc/volunteers.getById`
- `GET /trpc/volunteers.getCoreTrainingRecordCompletions`
- `POST /trpc/volunteers.create`
- `POST /trpc/volunteers.update`
- `POST /trpc/volunteers.updateName`
- `GET /trpc/volunteers.getAllPackagesByCoordinator`
- `POST /trpc/volunteers.delete`
- `POST /trpc/volunteers.end`

### mps
- `GET /trpc/mps.getAll`
- `GET /trpc/mps.getAllNotEndedYet`
- `GET /trpc/mps.getById`
- `GET /trpc/mps.getCoreTrainingRecordCompletions`
- `POST /trpc/mps.create`
- `POST /trpc/mps.update`
- `POST /trpc/mps.updateName`
- `POST /trpc/mps.delete`
- `POST /trpc/mps.end`

### trainingRecords
- `GET /trpc/trainingRecords.getAll`
- `GET /trpc/trainingRecords.getAllNotEndedYet`
- `GET /trpc/trainingRecords.getByExpiringBefore`
- `GET /trpc/trainingRecords.getById`
- `POST /trpc/trainingRecords.create`
- `POST /trpc/trainingRecords.update`
- `POST /trpc/trainingRecords.delete`
- `POST /trpc/trainingRecords.end`

### mag
- `GET /trpc/mag.getAll`
- `GET /trpc/mag.getById`
- `GET /trpc/mag.getByDateInterval`
- `POST /trpc/mag.create`
- `POST /trpc/mag.update`
- `POST /trpc/mag.delete`

### analytics (all queries)
- `GET /trpc/analytics.generateAttendanceAllowanceCrossSection`
- `GET /trpc/analytics.generateAttendanceAllowanceReport`
- `GET /trpc/analytics.generateCoordinatorAttendanceReport`
- `GET /trpc/analytics.getActiveRequestsCrossSection`
- `GET /trpc/analytics.getActivePackagesCrossSection`
- `GET /trpc/analytics.getRequestsReport`
- `GET /trpc/analytics.getPackagesReport`
- `GET /trpc/analytics.generateCoordinatorPackagesReport`
- `GET /trpc/analytics.getActiveRequestsDeprivationCrossSection`
- `GET /trpc/analytics.getActivePackagesDeprivationCrossSection`
- `GET /trpc/analytics.getRequestsDeprivationReport`
- `GET /trpc/analytics.getPackagesDeprivationReport`

