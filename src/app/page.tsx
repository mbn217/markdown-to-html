import { Converter } from "@/components/converter";
import { convertMarkdown } from "@/lib/markdown";
import { SAMPLE_FILENAME, SAMPLE_MARKDOWN } from "@/lib/sample";

export default async function Home() {
  // Only this bundled example is processed at build time. User files never reach the server.
  const example = await convertMarkdown(SAMPLE_MARKDOWN, SAMPLE_FILENAME);
  return <Converter example={example} />;
}
