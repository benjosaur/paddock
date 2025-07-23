import { Package, packageSchema } from "shared";
import { PackageRepository } from "./repository";
import { DbPackage } from "./schema";
import { firstYear } from "shared/const";

export class PackageService {
  packageRepository = new PackageRepository();

  async getAllNotArchived(user: User): Promise<Package[]> {
    const packages = await this.packageRepository.getAllNotArchived(user);
    const transformedResult = this.groupAndTransformPackageData(
      packages
    ) as Package[];
    const parsedResult = packageSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getAllNotEndedYet(user: User): Promise<Package[]> {
    const packages = await this.packageRepository.getAllNotEndedYet(user);
    const transformedResult = this.groupAndTransformPackageData(
      packages
    ) as Package[];
    const parsedResult = packageSchema.array().parse(transformedResult);
    return parsedResult;
  }

  async getAll(user: User, startYear: number = firstYear): Promise<Package[]> {
    const packages = await this.packageRepository.getAll(user, startYear);
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

  async create(newPackage: Omit<Package, "id">, user: User): Promise<string> {
    try {
      const validatedInput = packageSchema.omit({ id: true }).parse(newPackage);
      const { carerId, ...rest } = validatedInput;
      const packageSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const packageToCreate: Omit<DbPackage, "sK"> = {
        pK: carerId,
        entityType: `package#${packageSuffix}`,
        ...rest,
      };
      const createdPackageId = await this.packageRepository.create(
        [packageToCreate],
        user
      );
      return createdPackageId;
    } catch (error) {
      console.error("Service Layer Error creating packages:", error);
      throw error;
    }
  }

  async update(updatedPackage: Package, user: User): Promise<void> {
    try {
      const validatedInput = packageSchema.parse(updatedPackage);
      const { id, carerId, ...rest } = validatedInput;
      const packageSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const dbPackage: DbPackage = {
        ...validatedInput,
        pK: carerId,
        sK: id,
        entityType: `package#${packageSuffix}`,
        ...rest,
      };
      await this.packageRepository.update([dbPackage], user);
    } catch (error) {
      console.error("Service Layer Error updating packages:", error);
      throw error;
    }
  }

  async delete(user: User, packageId: string): Promise<number> {
    const numDeleted = await this.packageRepository.delete(packageId, user);
    return numDeleted[0];
  }

  private groupAndTransformPackageData(dbPackages: DbPackage[]): Package[] {
    return dbPackages.map((pkg) => {
      const { pK, sK, entityType, ...rest } = pkg;
      return { ...rest, id: sK, carerId: pK };
    });
  }
}
