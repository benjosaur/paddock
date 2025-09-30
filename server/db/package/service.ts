import {
  CoverDetails,
  coverDetailsSchema,
  Package,
  packageSchema,
} from "shared";
import { PackageRepository } from "./repository";
import { DbPackage } from "./schema";
import { firstYear } from "shared/const";
import { addDbMiddleware } from "../service";

export class PackageService {
  packageRepository = new PackageRepository();

  async getAllNotArchived(user: User): Promise<Package[]> {
    try {
      const packages = await this.packageRepository.getAllNotArchived(user);
      const transformedResult = this.groupAndTransformPackageData(
        packages
      ) as Package[];
      const parsedResult = packageSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all non-archived packages:",
        error
      );
      throw error;
    }
  }

  async getAllNotEndedYet(user: User): Promise<Package[]> {
    try {
      const packages = await this.packageRepository.getAllNotEndedYet(user);
      const transformedResult = this.groupAndTransformPackageData(
        packages
      ) as Package[];
      const parsedResult = packageSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error(
        "Service Layer Error getting all not ended packages:",
        error
      );
      throw error;
    }
  }

  async getAll(user: User, startYear: number = firstYear): Promise<Package[]> {
    try {
      const packages = await this.packageRepository.getAll(user, startYear);
      const transformedResult = this.groupAndTransformPackageData(
        packages
      ) as Package[];
      const parsedResult = packageSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all packages:", error);
      throw error;
    }
  }

  async getById(packageId: string, user: User): Promise<Package> {
    try {
      const pkg = await this.packageRepository.getById(packageId, user);
      const transformedResult = this.groupAndTransformPackageData(
        pkg
      ) as Package[];
      const parsedResult = packageSchema.array().parse(transformedResult);
      return parsedResult[0];
    } catch (error) {
      console.error("Service Layer Error getting package by ID:", error);
      throw error;
    }
  }

  async create(newPackage: Omit<Package, "id">, user: User): Promise<string> {
    try {
      const validatedInput = packageSchema.omit({ id: true }).parse(newPackage);
      const { carerId, ...rest } = validatedInput;
      const packageSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const packageToCreate: Omit<DbPackage, "sK"> = addDbMiddleware(
        {
          pK: carerId,
          entityType: `package#${packageSuffix}`,
          ...rest,
        },
        user
      );
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
      const dbPackage: DbPackage = addDbMiddleware(
        {
          pK: carerId,
          sK: id,
          entityType: `package#${packageSuffix}`,
          ...rest,
        },
        user
      );
      await this.packageRepository.update([dbPackage], user);
    } catch (error) {
      console.error("Service Layer Error updating packages:", error);
      throw error;
    }
  }

  async renew(
    oldPackage: Package,
    newPackage: Omit<Package, "id">,
    user: User
  ): Promise<string> {
    try {
      const validatedOldPackage = packageSchema.parse(oldPackage);
      const validatedNewPackage = packageSchema
        .omit({ id: true })
        .parse(newPackage);

      // Create new package
      const newPackageId = await this.create(validatedNewPackage, user);

      await this.update(validatedOldPackage, user);
      return newPackageId;
    } catch (error) {
      console.error("Service Layer Error renewing package:", error);
      throw error;
    }
  }

  async addCoverPeriod(
    pkg: Package,
    coverDetails: CoverDetails,
    user: User
  ): Promise<string[]> {
    // old -> cover -> new
    // set end date of existing package to day before cover start date
    // create new package with cover details
    // IF old package end date after cover end date
    //    THEN create new package with old carer starting day after cover end date
    try {
      const validatedOldPackage = packageSchema.parse(pkg);
      const validatedCoverDetails = coverDetailsSchema.parse(coverDetails);

      const dayBeforeCoverStart = new Date(validatedCoverDetails.startDate);
      dayBeforeCoverStart.setDate(dayBeforeCoverStart.getDate() - 1);

      const updatedOldPackage = {
        ...validatedOldPackage,
        endDate: dayBeforeCoverStart.toISOString().split("T")[0],
      };

      await this.update(updatedOldPackage, user);

      const coverPackage: Omit<Package, "id"> = {
        ...validatedOldPackage,
        details: {
          ...validatedOldPackage.details,
          oneOffStartDateHours: validatedCoverDetails.oneOffStartDateHours,
        },
        carerId: validatedCoverDetails.carerId,
        startDate: validatedCoverDetails.startDate,
        endDate: validatedCoverDetails.endDate,
      };

      const coverPackageId = await this.create(coverPackage, user);

      let newPackageId = "";

      if (validatedOldPackage.endDate > validatedCoverDetails.endDate) {
        const dayAfterCoverEnd = new Date(validatedCoverDetails.endDate);
        dayAfterCoverEnd.setDate(dayAfterCoverEnd.getDate() + 1);
        const newPackage: Omit<Package, "id"> = {
          ...validatedOldPackage,
          startDate: dayAfterCoverEnd.toISOString().split("T")[0],
        };
        newPackageId = await this.create(newPackage, user);
      }

      return [coverPackageId, newPackageId];
    } catch (error) {
      console.error("Service Layer Error renewing package:", error);
      throw error;
    }
  }

  async delete(user: User, packageId: string): Promise<number> {
    try {
      const numDeleted = await this.packageRepository.delete(packageId, user);
      return numDeleted[0];
    } catch (error) {
      console.error("Service Layer Error deleting package:", error);
      throw error;
    }
  }

  private groupAndTransformPackageData(dbPackages: DbPackage[]): Package[] {
    return dbPackages.map((pkg) => {
      const { pK, sK, entityType, ...rest } = pkg;
      return { ...rest, id: sK, carerId: pK };
    });
  }
}
