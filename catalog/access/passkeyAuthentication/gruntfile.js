module.exports = function (grunt) {
    require("mean-loader").GruntTask.cliche_task(
        grunt,
        "PasskeyAuthentication",
        ["CreatePasskey",
            "ValidatePasskeyWithRedirect",
            "SignOutWithRedirect",
            "LoggedIn"]);
}
