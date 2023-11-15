import {
  Header,
  IconButton,
  Dialog,
  Box,
  RadioGroup,
  FormControl,
  Radio,
  Button,
} from "@primer/react";
import { useFetcher } from "@remix-run/react";
import { GearIcon } from "@primer/octicons-react";
import { useState } from "react";
import { titleCase } from "~/components";
import type { ColorModeWithAuto } from "@primer/react/lib/ThemeProvider";

export function ColorModeSetting() {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();

  const choices: ColorModeWithAuto[] = ["dark", "light", "auto"];

  return (
    <Header.Item>
      <IconButton
        variant="invisible"
        aria-labelledby="N/A"
        icon={GearIcon}
        onClick={() => setOpen(true)}
      />
      <Dialog isOpen={open}>
        <Dialog.Header>Settings</Dialog.Header>
        <fetcher.Form
          onSubmit={() => setOpen(false)}
          method="post"
          action="/settings"
        >
          <Box display="grid" sx={{ gap: 3 }} p={3}>
            <RadioGroup name="colorMode">
              <RadioGroup.Label>This is not a pipe</RadioGroup.Label>
              {choices.map((choice) => (
                <FormControl key={choice}>
                  <Radio value={choice} />
                  <FormControl.Label>{titleCase(choice)}</FormControl.Label>
                </FormControl>
              ))}
            </RadioGroup>
          </Box>
          <Box p={3}>
            <Button type="submit">Save</Button>
          </Box>
        </fetcher.Form>
      </Dialog>
    </Header.Item>
  );
}
