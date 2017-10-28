import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {CompoundTransactionAtom} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CreateCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  createCompoundTransaction() {
    const defaultStatus = "unpaid";
    const status = this.compoundTransaction.status === undefined ?
      defaultStatus : this.compoundTransaction.status;

    this._graphQlService
      .post(`
        CreateCompoundTransaction(
          transactions: "${this.compoundTransaction.transactions}",
          status: "${status}"
        ) { atom_id }
      `)
      .subscribe(atom_id => {
          this.compoundTransaction.atom_id = atom_id;
          this.submit_ok.value = true;
      });
  }
}
