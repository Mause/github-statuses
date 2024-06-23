import type { IssueOrPullRequest } from "../overview";
import { Overview } from "../overview";
import { makeFactory, each, Derived } from "factory.ts";
import { Faker, en_AU, en } from "@faker-js/faker";

const withSeed = (seed: number) => {
  const faker = new Faker({ locale: [en_AU, en] });
  faker.seed(seed);
  return faker;
};

const factory = makeFactory<IssueOrPullRequest>({
  __typename: each((tick) =>
    withSeed(tick).helpers.arrayElement(["Issue", "PullRequest"]),
  ),
  id: each((tick) => `${tick}`),
  title: each((tick) => withSeed(tick).lorem.sentence()),
  url: new Derived<IssueOrPullRequest, string>(
    (parent) =>
      `https://github.com/${parent.repository.nameWithOwner}/issues/${parent.number}`,
  ),
  number: each((tick) => tick),
  repository: each((tick) => {
    const faker = withSeed(tick);
    return {
      nameWithOwner:
        faker.internet.userName() + "/" + faker.internet.domainWord(),
    };
  }),
});

const items = factory.buildList(10);

export default () => <Overview items={items} />;
