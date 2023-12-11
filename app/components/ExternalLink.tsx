import { IconButton } from "@primer/react";
import { LinkExternalIcon } from "@primer/octicons-react";

export function ExternalLink({
  children,
  href,
}: {
  children: string;
  href: string;
}) {
  return (
    <IconButton
      as="a"
      href={href}
      target="_blank"
      aria-label={children}
      icon={LinkExternalIcon}
    />
  );
}
