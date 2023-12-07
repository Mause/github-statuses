/**
 * This file exists to add the breadcrumb to the pull page.
 */

import { Outlet , useMatches } from "@remix-run/react";
import _ from "lodash";

export default () => {
  const matches = useMatches();
  if (_.last(matches)?.handle === "pull") {
    return (
      <>
        This space intentionally left blank.
        <Outlet />
      </>
    );
  } else {
    return <Outlet />;
  }
};
