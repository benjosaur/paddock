import { Package, packageSchema } from "shared";
import { PackageRepository } from "./repository";
import { DbPackage } from "./schema";

export class PackageService {
  packageRepository = new PackageRepository();

  async getAllActive(user: User): Promise<Package[]> {
    const packages = await this.packageRepository.getAllActive(user);
    const transformedResult = this.groupAndTransformPackageData(
      packages
    ) as Package[];
    const parsedResult = packageSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getAll(user: User): Promise<Package[]> {
    const packages = await this.packageRepository.getAll(user);
    const transformedResult = this.groupAndTransformPackageData(
      packages
    ) as Package[];
    const parsedResult = packageSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getById(packageId: string, user: User): Promise<Package> {
    const pkg = await this.packageRepository.getById(packageId, user);
    const transformedResult = this.groupAndTransformPackageData(
      pkg
    ) as Package[];
    const parsedResult = packageSchema.array().parse(transformedResult);
    return parsedResult[0];
  }

  async getBySubstring(string: string, user: User): Promise<Package[]> {
    const metaLogs = await this.packageRepository.getMetaLogsBySubstring(
      string,
      user
    );
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: Package[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.packageRepository.getById(id, user);
      const parsedLog = this.groupAndTransformPackageData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByPostCode(postCode: string, user: User): Promise<Package[]> {
    const metaLogs = await this.packageRepository.getMetaLogsByPostCode(
      user,
      postCode
    );
    const idsToFetch = metaLogs.map((log) => log.sK);
    const parsedResult: Package[] = [];
    for (const id of idsToFetch) {
      const fetchedLog = await this.packageRepository.getById(user, id);
      const parsedLog = this.groupAndTransformPackageData(fetchedLog);
      parsedResult.push(parsedLog[0]);
    }
    return parsedResult;
  }

  async getByDateInterval(
    input: {
      startDate: string;
      endDate: string;
    },
    user: User
  ): Promise<Package[]> {
    const mag = await this.packageRepository.getByDateInterval(user, input);
    const transformedResult = this.groupAndTransformPackageData(
      mag
    ) as Package[];
    const parsedResult = packageSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async create(newPackage: Omit<Package, "id">, user: User): Promise<Package> {
    const validatedInput = packageSchema.omit({ id: true }).parse(newPackage);

    const packageMain: Omit<DbPackageEntity, "pK" | "sK"> = {
      ...validatedInput,
      entityType: "package",
      entityOwner: "main",
    };
    const packageMps: Omit<DbPackageMp, "sK">[] = validatedInput.mps.map(
      (mp) => ({
        date: validatedInput.date,
        entityType: "package",
        entityOwner: "mp",
        pK: mp.id,
        ...mp,
      })
    );
    const packageClients: Omit<DbPackageClient, "sK">[] =
      validatedInput.clients.map((client) => ({
        date: validatedInput.date,
        entityType: "package",
        entityOwner: "client",
        pK: client.id,
        ...client,
      }));
    try {
      const createdLogId = await this.packageRepository.create(
        [packageMain, ...packageMps, ...packageClients],
        user
      );

      const fetchedLog = await this.getById(user, createdLogId);
      if (!fetchedLog) {
        throw new Error("Failed to fetch created mp log");
      }

      const { id, ...restFetched } = fetchedLog;

      if (JSON.stringify(validatedInput) !== JSON.stringify(restFetched)) {
        throw new Error("Created mp log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error creating packages:", error);
      throw error;
    }
  }

  async update(updatedPackage: Package, user: User): Promise<Package> {
    const validatedInput = packageSchema.parse(updatedPackage);
    const packageKey = validatedInput.id;
    // may previously have excess mps/clients no longer associated
    await this.packageRepository.delete(user, packageKey);
    const packageMain: DbPackageEntity = {
      ...validatedInput,
      pK: packageKey,
      sK: packageKey,
      entityType: "package",
      entityOwner: "main",
    };
    const packageMps: DbPackageMp[] = validatedInput.mps.map((mp) => ({
      pK: mp.id,
      sK: packageKey,
      date: validatedInput.date,
      entityType: "package",
      entityOwner: "mp",
      ...mp,
    }));
    const packageClients: DbPackageClient[] = validatedInput.clients.map(
      (client) => ({
        pK: client.id,
        sK: packageKey,
        date: validatedInput.date,
        entityType: "package",
        entityOwner: "client",
        ...client,
      })
    );
    try {
      await this.packageRepository.update(
        [packageMain, ...packageMps, ...packageClients],
        user
      );

      const fetchedLog = await this.getById(user, updatedPackage.id);
      if (!fetchedLog) {
        throw new Error("Failed to fetch updated mp log");
      }

      if (JSON.stringify(validatedInput) !== JSON.stringify(fetchedLog)) {
        throw new Error("Updated mp log does not match expected values");
      }

      return fetchedLog;
    } catch (error) {
      console.error("Service Layer Error updating packages:", error);
      throw error;
    }
  }

  async delete(user: User, packageId: string): Promise<number> {
    const numDeleted = await this.packageRepository.delete(user, packageId);
    return numDeleted[0];
  }

  private groupAndTransformPackageData(dbPackages: DbPackage[]): Package[] {
    return dbPackages.map((pkg) => {
      const { pK, sK, entityType, ...rest } = pkg;
      return { ...rest, id: sK, carerId: pK };
    });
  }
}
