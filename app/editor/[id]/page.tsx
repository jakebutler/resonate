import { FullScreenEditor } from "@/components/FullScreenEditor/FullScreenEditor";

interface EditorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const { id } = await params;
  const { date } = await searchParams;

  return (
    <FullScreenEditor
      postId={id}
      initialDate={date}
    />
  );
}
