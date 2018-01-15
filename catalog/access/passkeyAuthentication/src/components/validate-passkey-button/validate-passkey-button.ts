import { Widget, Field, PrimitiveAtom,
         WidgetValue, ClientBus } from "client-bus";

@Widget({
    fqelement: "PasskeyAuthentication"
})
export class ValidatePasskeyButtonComponent {
    @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
    @Field("Widget") on_validate_ok: PrimitiveAtom<WidgetValue>;

    constructor(private _client_bus: ClientBus) { }

    submit() {
        this.submit_ok.value = true;
        this._client_bus.navigate(this.on_validate_ok.value);
    }
}
