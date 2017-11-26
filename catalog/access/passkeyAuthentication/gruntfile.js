module.exports = function (grunt) {
    require("mean-loader").GruntTask.cliche_task(
        grunt,
        "PasskeyAuthentication",
        ["CreateCustomPasskey",
            "CreateRandomPasskey",
            "ValidatePasskeyWithRedirect",
            "PasskeySignOutWithRedirect",
            "LoggedIn"]);
}
