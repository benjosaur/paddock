import {
  CoverDetails,
  coverDetailsSchema,
  Package,
  packageSchema,
  EndPackageDetails,
  solePackageSchema,
  SolePackage,
  reqPackageSchema,
  ReqPackage,
} from "shared";
import { PackageRepository } from "./repository";
import { DbPackage, DbSolePackage } from "./schema";
import { firstYear } from "shared/const";
import { addDbMiddleware } from "../service";
import { z } from "zod";

export class PackageService {
  packageRepository = new PackageRepository();

  async getAllWithoutInfoNotEndedYet(user: User): Promise<Package[]> {
    try {
      const packages = await this.packageRepository.getAllNotEndedYet(user);
      const packagesWithoutInfo = packages.filter(
        (pkg) => !pkg.details.services.some((s) => s === "Information")
      );
      const transformedResult = this.groupAndTransformPackageData(
        packagesWithoutInfo
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

  async getAllInfo(
    user: User,
    startYear: number = firstYear
  ): Promise<Package[]> {
    try {
      const packages = await this.packageRepository.getAll(user, startYear);
      const packagesWithInfo = packages.filter((pkg) =>
        pkg.details.services.some((s) => s === "Information")
      );
      const transformedResult = this.groupAndTransformPackageData(
        packagesWithInfo
      ) as Package[];
      const parsedResult = packageSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all packages:", error);
      throw error;
    }
  }

  async getAllWithoutInfo(
    user: User,
    startYear: number = firstYear
  ): Promise<Package[]> {
    try {
      const packages = await this.packageRepository.getAll(user, startYear);
      const packagesWithoutInfo = packages.filter(
        (pkg) => !pkg.details.services.some((s) => s === "Information")
      );
      const transformedResult = this.groupAndTransformPackageData(
        packagesWithoutInfo
      ) as Package[];
      const parsedResult = packageSchema.array().parse(transformedResult);
      return parsedResult;
    } catch (error) {
      console.error("Service Layer Error getting all packages:", error);
      throw error;
    }
  }

  async getById(
    packageId: string,
    user: User
  ): Promise<ReqPackage | SolePackage> {
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

  async create(
    newPackage: Omit<ReqPackage, "id">,
    user: User
  ): Promise<string> {
    try {
      const validatedInput = z
        .union([
          reqPackageSchema.omit({ id: true }),
          solePackageSchema.omit({ id: true }),
        ])
        .parse(newPackage);
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

  async createSole(
    newSolePackage: Omit<SolePackage, "id">,
    user: User
  ): Promise<string> {
    try {
      const validatedInput = solePackageSchema
        .omit({ id: true })
        .parse(newSolePackage);
      const { carerId, ...rest } = validatedInput;
      const packageSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const packageToCreate: Omit<DbSolePackage, "sK"> = addDbMiddleware(
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
      console.error("Service Layer Error creating sole packages:", error);
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

  async updateSole(updatedPackage: SolePackage, user: User): Promise<void> {
    try {
      const validatedInput = solePackageSchema.parse(updatedPackage);
      const { id, carerId, ...rest } = validatedInput;
      const packageSuffix = validatedInput.endDate.slice(0, 4); // open or yyyy
      const dbPackage: DbSolePackage = addDbMiddleware(
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
      const validatedNewPackage = z
        .union([
          solePackageSchema.omit({ id: true }),
          reqPackageSchema.omit({ id: true }),
        ])
        .parse(newPackage);

      // Create new package

      let newPackageId = "";

      if ("requestId" in validatedNewPackage) {
        newPackageId = await this.create(validatedNewPackage, user);
      } else {
        newPackageId = await this.createSole(validatedNewPackage, user);
      }

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

      let coverPackageId = "";
      if ("requestId" in coverPackage) {
        coverPackageId = await this.create(coverPackage as ReqPackage, user);
      } else {
        coverPackageId = await this.createSole(
          coverPackage as SolePackage,
          user
        );
      }

      let newPackageId = "";

      if (validatedOldPackage.endDate > validatedCoverDetails.endDate) {
        const dayAfterCoverEnd = new Date(validatedCoverDetails.endDate);
        dayAfterCoverEnd.setDate(dayAfterCoverEnd.getDate() + 1);
        const newPackage: Omit<Package, "id"> = {
          ...validatedOldPackage,
          startDate: dayAfterCoverEnd.toISOString().split("T")[0],
        };

        if ("requestId" in newPackage) {
          newPackageId = await this.create(newPackage as ReqPackage, user);
        } else {
          newPackageId = await this.createSole(newPackage as SolePackage, user);
        }
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

  async endPackage(user: User, endDetails: EndPackageDetails): Promise<void> {
    try {
      const packageRecords = await this.packageRepository.getById(
        endDetails.packageId,
        user
      );

      if (!packageRecords.length) return;

      const packageSuffix = endDetails.endDate.slice(0, 4);

      const updatedRecords = packageRecords.map((record) => {
        const currentEnd = record.endDate as string;
        const shouldUpdate =
          currentEnd === "open" ||
          new Date(endDetails.endDate) < new Date(currentEnd);

        return addDbMiddleware(
          {
            ...record,
            entityType: shouldUpdate
              ? `package#${packageSuffix}`
              : record.entityType,
            endDate: shouldUpdate ? endDetails.endDate : currentEnd,
          },
          user
        );
      });

      await this.packageRepository.update(updatedRecords, user);
    } catch (error) {
      console.error("Service Layer Error ending package:", error);
      throw error;
    }
  }

  private groupAndTransformPackageData(
    dbPackages: DbPackage[]
  ): (Package | SolePackage)[] {
    return dbPackages.map((pkg) => {
      const { pK, sK, entityType, ...rest } = pkg;
      return { ...rest, id: sK, carerId: pK };
    });
  }
}
