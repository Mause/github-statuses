import { Box } from "@primer/react";
import { useMemo } from "react";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CHOICES = [
  "Find what you're looking for, pal?",
  "Go away.",
  "Go back.",
  "Nothing to see here.",
  "Take a hike.",
  "Take a wrong turn at Albuquerque?",
  "Take a wrong turn?",
  "Take the wrong path, pal?",
  "There's nothing here.",
  "This space left intentionally blank.",
  "What are you doing here?",
  "What's supposed to be here?",
  "You're in the wrong place.",
  "You're lost.",
  "You're not supposed to be here.",
];

const randomChoice = (choices: string[]) => {
  return choices[getRandomInt(0, choices.length)];
};

export function DefaultMessage({ children: message }: { children?: string }) {
  const alternateMessage = useMemo(() => randomChoice(CHOICES), []);

  return (
    <Box padding={3} bg="gray.1">
      {message ?? alternateMessage}
    </Box>
  );
}
