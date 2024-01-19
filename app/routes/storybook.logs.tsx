import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Logs from "~/routes/$owner.$repo.actions.$id.logs";
import type { Job } from "~/services/archive.server";

const logs = {
  "ubuntu-latest (release)": [
    {
      name: "Run r-libactionscheck-r-package@v2",
      filename: "10_Run r-libactionscheck-r-package@v2.txt",
      index: 1,
      contents: [
        "2023-12-01T03:23:02.9997997Z ##[group]Run ## --------------------------------------------------------------------",
        "2023-12-01T03:23:02.9998545Z \u001b[36;1m## --------------------------------------------------------------------\u001b[0m",
        "2023-12-01T03:23:02.9998980Z \u001b[36;1moptions(crayon.enabled = TRUE)\u001b[0m",
        '2023-12-01T03:23:02.9999557Z \u001b[36;1mcat("LOGNAME=", Sys.info()[["user"]], "\\n", sep = "", file = Sys.getenv("GITHUB_ENV"), append = TRUE)\u001b[0m',
        '2023-12-01T03:23:03.0000368Z \u001b[36;1mif (Sys.getenv("_R_CHECK_FORCE_SUGGESTS_", "") == "") Sys.setenv("_R_CHECK_FORCE_SUGGESTS_" = "false")\u001b[0m',
        '2023-12-01T03:23:03.0001158Z \u001b[36;1mif (Sys.getenv("_R_CHECK_CRAN_INCOMING_", "") == "") Sys.setenv("_R_CHECK_CRAN_INCOMING_" = "false")\u001b[0m',
        '2023-12-01T03:23:03.0002281Z \u001b[36;1mcat("check-dir-path=", file.path(getwd(), ("check")), "\\n", file = Sys.getenv("GITHUB_OUTPUT"), sep = "", append = TRUE)\u001b[0m',
        '2023-12-01T03:23:03.0003466Z \u001b[36;1mcheck_results <- rcmdcheck::rcmdcheck(args = (c("--no-tests", "--no-manual", "--as-cran", "--no-multiarch")), build_args = ("--no-manual"), error_on = ("warning"), check_dir = ("check"))\u001b[0m',
        "2023-12-01T03:23:03.0011944Z shell: /usr/local/bin/Rscript {0}",
        "2023-12-01T03:23:03.0012257Z env:",
        "2023-12-01T03:23:03.0012474Z   DUCKDB_R_REPO: duckdb/duckdb-r",
        "2023-12-01T03:23:03.0012770Z   TARGET_REF: main",
        "2023-12-01T03:23:03.0013019Z   DUCKDB_R_SRC: duckdb-r",
        "2023-12-01T03:23:03.0013274Z   DUCKDB_SRC: duckdb",
        "2023-12-01T03:23:03.0013523Z   GH_TOKEN: ",
        "2023-12-01T03:23:03.0013885Z   GITHUB_PAT: ***",
        "2023-12-01T03:23:03.0014130Z   R_KEEP_PKG_SOURCE: yes",
        "2023-12-01T03:23:03.0014440Z   R_LIBS_USER: /home/runner/work/_temp/Library",
        "2023-12-01T03:23:03.0014786Z   TZ: UTC",
        "2023-12-01T03:23:03.0015005Z   _R_CHECK_SYSTEM_CLOCK_: FALSE",
        "2023-12-01T03:23:03.0015296Z   NOT_CRAN: true",
        "2023-12-01T03:23:03.0015683Z   RSPM: https://packagemanager.posit.co/cran/__linux__/jammy/latest",
        "2023-12-01T03:23:03.0016340Z   RENV_CONFIG_REPOS_OVERRIDE: https://packagemanager.posit.co/cran/__linux__/jammy/latest",
        "2023-12-01T03:23:03.0016919Z   R_LIB_FOR_PAK: /opt/R/4.3.2/lib/R/site-library",
        "2023-12-01T03:23:03.0017261Z ##[endgroup]",
        "",
      ],
    },
  ],
} satisfies Job;

export const loader = async ({ request }: DataFunctionArgs) => {
  return json({
    logs,
  });
};

export default () => {
  return <Logs />;
};
