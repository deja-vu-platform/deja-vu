export class Validation {
  static async existsOrFail(
    collection, id: string, type: string): Promise<any> {
    const doc = await collection.findOne({ id: id });
    if (!doc) {
      throw new Error(`${type} ${id} not found`);
    }
    return doc;
  }
}
