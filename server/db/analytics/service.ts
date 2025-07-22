/* 
- **Generate Total Active Requests By PostCode & Service**
- **Generate Total Active Packages By PostCode & Service**

- **Generate Requests Report** (start yyyy)
	- Monthly with Yearly metrics
	- GSI3-PK == request#{yyyy, yyyy, open}
	- Post Process:
	- Init array
		- [{year:"yyyy", months: [{month: "Jan", villages: [wivey: {service: }, milverton: 0], services: [befriending: 0, transport: 0]}, ...]}, ...]
	- For each request. Get weekly hours. Get Start Date. Get End Date. Derive total days covered in each month / 7 * weeklyHours and append to totalHours. Get village add to village entry. Get service(s), add to each service. Repeat

- **Generate Packages Report** Starting from year yyyy
	- Monthly with Yearly metrics
	- GSI3-PK == package#{yyyy, yyyy, open}
	- Post Process:
	- Init array
		- [{year:"yyyy", months: [{month: "Jan", totalHours: 0, villages: [wivey: 0, milverton: 0], services: [befriending: 0, transport: 0]}, ...]}, ...]
	- For each request. Get weekly hours. Get Start Date. Get End Date. Derive total days covered in each month / 7 * weeklyHours and append to totalHours. Get village add to village entry. Get service(s), add to each service. Repeat
*/

import { PackageService } from "../package/service";
import { RequestService } from "../requests/service";

export class ReportService {
  requestService = new RequestService();
  packageService = new PackageService();
  async generateRequestsReport(startYear: number): Promise<any> {}
}
