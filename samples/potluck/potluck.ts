import {EventModule} from "dv/catalog/organization/event";

@NgModule({
  declarations: [AppComponent],
  imports: [EventModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}


@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  title = "Potluck";
}
