import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// Plain text for copies from the editor. The default ProseMirror serializer flattens lists into
// bare lines, so pasting into a plain text target loses the structure the user wrote.
// This keeps the markdown markers for lists, task lists, headings, quotes and code blocks.

function fragmentToText(fragment: Fragment, separator: string): string {
	const parts: string[] = []
	fragment.forEach(node => parts.push(nodeToText(node)))
	return parts.join(separator)
}

function prefixLines(text: string, firstPrefix: string, restPrefix: string): string {
	return text
		.split('\n')
		.map((line, index) => {
			const prefix = index === 0 ? firstPrefix : restPrefix
			return line === '' ? prefix.trimEnd() : prefix + line
		})
		.join('\n')
}

function listItemToText(item: ProseMirrorNode, marker: string): string {
	const body = fragmentToText(item.content, '\n')
	return prefixLines(body, marker, ' '.repeat(marker.length))
}

function nodeToText(node: ProseMirrorNode): string {
	switch (node.type.name) {
		case 'bulletList': {
			const items: string[] = []
			node.forEach(item => items.push(listItemToText(item, '- ')))
			return items.join('\n')
		}
		case 'orderedList': {
			const start = Number(node.attrs.start ?? 1)
			const items: string[] = []
			node.forEach(item => items.push(listItemToText(item, `${start + items.length}. `)))
			return items.join('\n')
		}
		case 'taskList': {
			const items: string[] = []
			node.forEach(item => {
				const checked = Boolean(item.attrs.checked)
				items.push(listItemToText(item, checked ? '- [x] ' : '- [ ] '))
			})
			return items.join('\n')
		}
		case 'heading':
			return '#'.repeat(Number(node.attrs.level ?? 1)) + ' ' + node.textContent
		case 'blockquote':
			return prefixLines(fragmentToText(node.content, '\n\n'), '> ', '> ')
		case 'codeBlock':
			return '```\n' + node.textContent + '\n```'
		case 'horizontalRule':
			return '---'
		default:
			if (node.isTextblock || node.isLeaf) {
				return node.textContent
			}
			return fragmentToText(node.content, '\n\n')
	}
}

export function sliceToMarkdownText(slice: Slice): string {
	return fragmentToText(slice.content, '\n\n').trim()
}
