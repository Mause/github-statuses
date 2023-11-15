import { Wrapper, titleCase } from "~/components";
import {
  Box,
  RadioGroup,
  FormControl,
  Radio,
  Button,
  Heading,
  Flash,
  useSafeTimeout,
} from "@primer/react";
import { useFetcher, useMatches } from "@remix-run/react";
import { useState } from "react";
import type { ColorModeWithAuto } from "@primer/react/lib/ThemeProvider";
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { colorModeCookie } from "~/components/cookies";

export const action: ActionFunction = async ({ request }) => {
  const colorMode = (await request.formData()).get("colorMode");

  const setCookie = await colorModeCookie.serialize(colorMode);

  return json(
    { colorMode },
    {
      headers: {
        "Set-Cookie": setCookie,
      },
    },
  );
};

export default function Settings() {
  const [open, setOpen] = useState(false);
  const { data } = useMatches()[0];
  const fetcher = useFetcher();

  const colorMode = data?.colorMode;

  const choices: ColorModeWithAuto[] = ["dark", "light", "auto"];

  const safeTimeout = useSafeTimeout();

  return (
    <Wrapper>
      <></>
      <>
        <Heading>Settings</Heading>
        {open ? <Flash>Settings saved</Flash> : undefined}
        <fetcher.Form
          onSubmit={() => {
            setOpen(true);
            safeTimeout.safeSetTimeout(() => setOpen(false), 3000);
          }}
          method="post"
          action="/settings"
        >
          <Box display="grid" sx={{ gap: 3 }} p={3}>
            <RadioGroup name="colorMode" required>
              <RadioGroup.Label>This is not a pipe</RadioGroup.Label>
              {choices.map((choice) => (
                <FormControl key={choice}>
                  <Radio value={choice} defaultChecked={choice == colorMode} />
                  <FormControl.Label>{titleCase(choice)}</FormControl.Label>
                </FormControl>
              ))}
            </RadioGroup>
          </Box>
          <Box p={3}>
            <Button type="submit">Save</Button>
          </Box>
        </fetcher.Form>
      </>
    </Wrapper>
  );
}
