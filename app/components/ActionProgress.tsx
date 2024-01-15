import { ProgressBar } from "@primer/react";
import _ from "lodash";
import type { Dictionary } from "lodash";
import { titleCase } from "~/components";

const style = "emphasis";

const GREEN = `success.${style}`;
const RED = `danger.${style}`;
const YELLOW = `attention.${style}`;
const colourMap: Record<string, string> = {
  SUCCESS: GREEN,
  FAILURE: RED,
  ACTION_REQUIRED: GREEN,
  TIMED_OUT: RED,
  IN_PROGRESS: YELLOW,
  COMPLETED: GREEN,
  QUEUED: YELLOW,
};

export function ActionProgress({
  counts,
  progress,
}: {
  counts: Dictionary<number>;
  progress: number;
}) {
  const total = _.sum(Object.values(counts));
  return (
    <>
      <ProgressBar sx={{ height: "20px" }} aria-valuetext={`${progress}%`}>
        {Object.entries(counts).map(([key, value]) => {
          const colour = colourMap[key] || `neutral.${style}`;
          const progress = (value / total) * 100;
          return (
            <ProgressBar.Item
              key={key}
              title={colour}
              sx={{
                backgroundColor: colour,
                color: "white",
              }}
              progress={progress}
            >
              {Math.round(progress)}% - {titleCase(key)}
            </ProgressBar.Item>
          );
        })}
      </ProgressBar>
      {progress}%
    </>
  );
}
