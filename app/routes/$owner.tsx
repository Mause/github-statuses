import Index from "./index";
export { loader } from "./index";

export default function Owner() {
  return <Index asChildRoute={true} />;
}
