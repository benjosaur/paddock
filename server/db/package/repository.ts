import { DbPackage, dbPackage } from "./schema";
import {
  client,
  getTableName,
  addCreateMiddleware,
  addUpdateMiddleware,
} from "../repository";
import { DeleteCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { firstYear } from "shared/const";

export class PackageRepository {
  async getAllNotArchived(user: User): Promise<DbPackage[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const commands: QueryCommand[] = [];

    for (let year = firstYear; year <= currentYear; year++) {
      const packageEndedInYear = new QueryCommand({
        TableName: getTableName(user),
        IndexName: "GSI1",
        KeyConditionExpression: `entityType = :pk AND archived = :sk`,
        ExpressionAttributeValues: {
          ":pk": `package#${year}`,
          ":sk": "N",
        },
      });
      commands.push(packageEndedInYear);
    }

    const openPackageCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI1",
      KeyConditionExpression: "entityType = :pk AND archived = :sk",
      ExpressionAttributeValues: {
        ":pk": `package#open`,
        ":sk": "N",
      },
    });

    commands.push(openPackageCommand);

    try {
      const results = await Promise.all(
        commands.map((command) => client.send(command))
      );

      const allItems = results.flatMap((result) => result.Items);
      const parsedResult = dbPackage.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client requests:", error);
      throw error;
    }
  }

  async getAllNotEndedYet(user: User): Promise<DbPackage[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));

    const openPackageCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: "entityType = :pk",
      ExpressionAttributeValues: {
        ":pk": `package#open`,
      },
    });

    const endsAfterTodayPackageCommand = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI3",
      KeyConditionExpression: `entityType = :pk AND endDate >= :sK`,
      ExpressionAttributeValues: {
        ":pk": `package#${currentYear}`,
        ":sK": currentDate,
      },
    });

    try {
      const [openPackageResult, endsAfterTodayPackageResult] =
        await Promise.all([
          client.send(openPackageCommand),
          client.send(endsAfterTodayPackageCommand),
        ]);

      const allItems = [
        ...(openPackageResult.Items || []),
        ...(endsAfterTodayPackageResult.Items || []),
      ];
      const parsedResult = dbPackage.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client packages:", error);
      throw error;
    }
  }

  async getAll(startYear: number, user: User): Promise<DbPackage[]> {
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentYear = parseInt(currentDate.slice(0, 4));
    const commands: QueryCommand[] = [];

    for (let year = startYear; year <= currentYear; year++) {
      const packageEndedInYear = new QueryCommand({
        TableName: getTableName(user),
        IndexName: "GSI3",
        KeyConditionExpression: `entityType = :pk`,
        ExpressionAttributeValues: {
          ":pk": `package#${year}`,
        },
      });
      commands.push(packageEndedInYear);
    }

    try {
      const results = await Promise.all(
        commands.map((command) => client.send(command))
      );

      const allItems = results.flatMap((result) => result.Items);
      const parsedResult = dbPackage.array().parse(allItems);
      return parsedResult;
    } catch (error) {
      console.error("Error getting client packages:", error);
      throw error;
    }
  }

  async getById(packageId: string, user: User): Promise<DbPackage[]> {
    const command = new QueryCommand({
      TableName: getTableName(user),
      IndexName: "GSI5",
      KeyConditionExpression: "sK = :sk",
      ExpressionAttributeValues: {
        ":sk": packageId,
      },
    });

    try {
      const result = await client.send(command);
      const parsedResult = dbPackage.array().parse(result.Items);
      return parsedResult;
    } catch (error) {
      console.error("Error getting package by ID:", error);
      throw error;
    }
  }

  async create(
    newPackages: Omit<DbPackage, "sK">[],
    user: User
  ): Promise<string> {
    const uuid = uuidv4();
    const key = `pkg#${uuid}`;
    const newItems = newPackages.map((pkg) => ({
      sK: key,
      ...pkg,
    }));
    const validatedItems = dbPackage.array().parse(newItems);
    try {
      await Promise.all(
        validatedItems.map((newItem) =>
          client.send(
            new PutCommand({
              TableName: getTableName(user),
              Item: addCreateMiddleware(newItem, user),
            })
          )
        )
      );
      return key;
    } catch (error) {
      console.error("Repository Layer Error creating packages:", error);
      throw error;
    }
  }
  async update(updatedPackages: DbPackage[], user: User): Promise<void> {
    const validatedLogs = dbPackage.array().parse(updatedPackages);
    try {
      await Promise.all(
        validatedLogs.map((log) =>
          client.send(
            new PutCommand({
              TableName: getTableName(user),
              Item: addUpdateMiddleware(log, user),
            })
          )
        )
      );
    } catch (error) {
      console.error("Repository Layer Error updating packages:", error);
      throw error;
    }
  }
  async delete(packageId: string, user: User): Promise<number[]> {
    const existingLogs = await this.getById(packageId, user);
    try {
      await Promise.all(
        existingLogs.map((log) =>
          client.send(
            new DeleteCommand({
              TableName: getTableName(user),
              Key: { pK: log.pK, sK: log.sK },
            })
          )
        )
      );
      return [existingLogs.length];
    } catch (error) {
      console.error("Repository Layer Error deleting packages:", error);
      throw error;
    }
  }
}
