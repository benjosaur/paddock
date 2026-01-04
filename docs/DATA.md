# DynamoDB Data Model

## Table: WiveyCares2

**Always present on every row**

- `pK` — String — partition key
- `sK` — String — sort key
- `entityType` — String — discriminator for item shape
- `updatedAt` — String — ISO-8601 timestamp
- `updatedBy` — String — user id who made the change

**Global Secondary Indexes**

- `GSI1`: partition `requestId` (String), sort `sK` (String) — fetch a request and its packages.
- `GSI2`: partition `entityType` (String), sort `endDate` (String) — filter by type and open/ended date.
- `GSI3`: partition `entityType` (String), sort `date` (String) — MAG logs by date.
- `GSI4`: partition `sK` (String), sort `pK` (String) — rows that share a sort key (e.g., packages for a request, MAG references).
- `GSI5`: partition `entityType` (String), sort `expiryDate` (String) — expiring training records.

### Entity rows

- **Client** (`entityType = "client"`, `pK = sK = c#<uuid>`)

  - `dateOfBirth` — String — date or `"Unknown"`
  - `endDate` — String — date or `"open"`
  - `details` — Map
    - `name` — String
    - `address` — Map (streetAddress, locality, county, postCode, deprivation {income: Bool, health: Bool})
    - `phone`, `email`, `nextOfKin` — String
    - `services` — List<String>
    - `attendsMag` — Bool
    - `notes` — List<{date: String, note: String, source: String, minutesTaken: Number}>
    - `customId` — String
    - `donationScheme` — Bool
    - `donationAmount` — Number
    - `referredBy` — String
    - `clientAgreementDate`, `clientAgreementComments` — String
    - `riskAssessmentDate`, `riskAssessmentComments` — String
    - `attendanceAllowance` — Map {requestedLevel: String, hoursToCompleteRequest: Number, completedBy {id: String, name: String}, requestedDate: String, status: String, confirmationDate: String}
    - `endReason` — String

- **Volunteer** (`entityType = "volunteer"`, `pK = sK = v#<uuid>`)

  - `dateOfBirth` — String
  - `endDate` — String — date or `"open"`
  - `dbsExpiry`, `publicLiabilityExpiry` — String (date or empty)
  - `details` — Map: client person fields plus `capacity` (String), `dbsNumber` (String), `publicLiabilityNumber` (String), `startDate` (String), `role` (String enum)

- **MP** (`entityType = "mp"`, `pK = sK = mp#<uuid>`)

  - Same shape as Volunteer, without `role`; keeps `capacity`, `dbsNumber`, `publicLiabilityNumber`, `startDate`

- **Request** (`entityType = "request#<year|open>"`, `pK = clientId`, `sK = requestId req#<uuid>`, also stores `requestId` for GSI1)

  - `requestType` — String enum
  - `startDate` — String (date)
  - `endDate` — String (date or `"open"`)
  - `details` — Map {customId: String, name: String, weeklyHours: Number, oneOffStartDateHours: Number, address: Map with deprivation flags, status: String, services: List<String>, notes: String}

- **Package** (`entityType = "package#<year|open>"`, `pK = carerId` (mp/vol), `sK = pkg#<uuid>`)

  - `requestId` — String (only when linked to a request)
  - `startDate` — String (date)
  - `endDate` — String (date or `"open"`)
  - `details` — Map {name: String, weeklyHours: Number, oneOffStartDateHours: Number, services: List<String>, notes: String, address: Map with deprivation flags when linked to a request}

- **Training record** (`entityType = "trainingRecord"`, `pK = ownerId` mp/volunteer, `sK = tr#<uuid>`)

  - `completionDate` — String (date or "")
  - `expiryDate` — String (date or "")
  - `endDate` — String (date or `"open"`)
  - `details` — Map {name: String, recordName: String enum, recordNumber: String, notes: String}

- **MAG log main** (`entityType = "magLogEntity"`, `pK = sK = mag#<uuid>`)

  - `date` — String (date)
  - `totalHours` — Number
  - `clients` — List<{id: String, details {name: String, address: Map}}>
  - `mps` — List<{id: String, details {name: String}}>
  - `volunteers` — List<{id: String, details {name: String}}>
  - `details` — Map {totalClients: Number, totalFamily: Number, totalVolunteers: Number, totalMps: Number, otherAttendees: Number, notes: String}

- **MAG log references** (`entityType = "magLogClient" | "magLogMp" | "magLogVolunteer"`, `pK = participant id`, `sK = mag#<uuid>`)
  - `date` — String (date)
  - `details` — Map matching the participant type
  - `entityOwner` — String — `"client"`, `"mp"`, or `"volunteer"`

All numbers are DynamoDB `N`. Dates are stored as ISO strings (`YYYY-MM-DD` or full timestamp).

## Table: DeprivationCompact (data model `IndicesOfDeprivation2025`)

- `postcode` — String — partition key
- `incomeDecile` — Number
- `healthDecile` — Number
