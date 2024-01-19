import { ActionProgress } from "~/components/ActionProgress";

export default () => {
  return (
    <ActionProgress
      counts={{
        IN_PROGRESS: 5,
        QUEUED: 5,
        SUCCESS: 5,
      }}
      progress={5}
    />
  );
};
