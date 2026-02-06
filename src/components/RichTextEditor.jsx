import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Unlink } from 'lucide-react'

const MenuBar = ({ editor }) => {
  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl || 'https://')
    
    if (url === null) return // Cancelled
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex gap-1 p-2 border-b border-stone-200 bg-stone-50">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-stone-200 transition-colors ${
          editor.isActive('bold') ? 'bg-stone-200' : ''
        }`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-stone-200 transition-colors ${
          editor.isActive('italic') ? 'bg-stone-200' : ''
        }`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px bg-stone-300 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-stone-200 transition-colors ${
          editor.isActive('bulletList') ? 'bg-stone-200' : ''
        }`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-stone-200 transition-colors ${
          editor.isActive('orderedList') ? 'bg-stone-200' : ''
        }`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px bg-stone-300 mx-1" />
      <button
        type="button"
        onClick={setLink}
        className={`p-2 rounded hover:bg-stone-200 transition-colors ${
          editor.isActive('link') ? 'bg-stone-200' : ''
        }`}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className={`p-2 rounded hover:bg-stone-200 transition-colors ${
          !editor.isActive('link') ? 'opacity-30 cursor-not-allowed' : ''
        }`}
        title="Remove Link"
      >
        <Unlink className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-teal-600 underline',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none',
      },
    },
  })

  return (
    <div className="border border-stone-200 rounded-sm bg-white overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  )
}
