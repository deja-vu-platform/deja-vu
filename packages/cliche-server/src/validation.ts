import * as mongodb from 'mongodb';

export class Validation {
  static async existsOrFail<T>(
    collection: mongodb.Collection<T>, id: string, type: string): Promise<T> {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }

    return doc;
  }
}
