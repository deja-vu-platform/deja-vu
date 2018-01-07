
export interface Mutation {
  // Mutations should only commit the changes on `commit`. After prepare,
  // mutations can be aborted (usually because some invariant in another
  // mutation that is part of a transaction would get violated)

  prepare: () => Promise<boolean>;

  commit: () => Promise<any>;

  onCommitSuccess?: () => undefined;

  abort: () => Promise<void>;
}
