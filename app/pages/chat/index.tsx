import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useAuth} from '~/context/authContext'
import useWsToken from '~/services/chat/hooks/useWsToken'
import {type ChatMessage, useChat} from '~/services/chat/hooks/useChat'
import useConversations from '~/services/chat/hooks/useConversations'
import type {ConversationItem} from '~/services/chat/api/getConversations'
import {createConversation} from '~/services/chat/api/createConversation'
import {getConversationMessages} from '~/services/chat/api/getConversationMessages'
import {updateConversationTitle} from '~/services/chat/api/updateConversationTitle'
import {mapHistoryToChatMessages, resolveSelectedConversationId} from '~/services/chat/utils/chatState'
import toast, {Toaster} from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Sub-components (kept in same file per design decision)
// ---------------------------------------------------------------------------

/** 2.1 — ChatHeader: title, role badge, connection dot, user dropdown */
function ChatHeader({
                        role,
                        userEmail,
                        isConnected,
                        onLogout,
                    }: {
    role: string
    userEmail: string
    isConnected: boolean
    onLogout: () => void
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    return (
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-800">BankBot</h1>
                <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        role === 'ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-indigo-100 text-indigo-700'
                    }`}
                >
                    {role}
                </span>
                <span
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
                />
            </div>
            <div className="flex items-center gap-2">
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setDropdownOpen((o) => !o)}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition max-w-[160px]"
                    >
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{userEmail}</span>
                        <svg className="w-3 h-3 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                            <button
                                onClick={() => { setDropdownOpen(false); onLogout() }}
                                className="w-full text-left text-sm px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

/** 3.1 — MessageBubble: right-aligned indigo for user, left-aligned gray for assistant, amber tool call */
function MessageBubble({message}: { message: ChatMessage }) {
    const [expanded, setExpanded] = useState(false)

    if (message.role === 'tool') {
        return (
            <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs">
                    <button
                        onClick={() => setExpanded((e) => !e)}
                        className="flex items-center gap-1.5 text-amber-700 font-medium w-full text-left"
                    >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-6.723M15.126 11.374l-.034-.035a2.652 2.652 0 00-3.748 3.748l.034.035"/>
                        </svg>
                        <span>Tool: {message.toolName}</span>
                        <svg className={`w-3 h-3 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    {expanded && (
                        <pre className="mt-2 text-gray-600 whitespace-pre-wrap break-all overflow-auto max-h-40 font-mono text-[11px]">
                            {(() => {
                                try { return JSON.stringify(JSON.parse(message.content), null, 2) }
                                catch { return message.content }
                            })()}
                        </pre>
                    )}
                </div>
            </div>
        )
    }

    const isUser = message.role === 'user'
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
            >
                {message.content}
            </div>
        </div>
    )
}

/** 3.3 — TypingIndicator: animated three-dot indicator */
function TypingIndicator() {
    return (
        <div className="flex justify-start">
            <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]"/>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]"/>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]"/>
            </div>
        </div>
    )
}

/** 3.2 — MessageList: renders messages with auto-scroll via useRef + scrollIntoView */
function MessageList({
                         messages,
                         isTyping,
                     }: {
    messages: ChatMessage[]
    isTyping: boolean
}) {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages, isTyping])

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && !isTyping && (
                <div className="text-center text-gray-400 mt-20">
                    <p className="text-lg">Ciao! Come posso aiutarti?</p>
                    <p className="text-sm mt-1">Scrivi un messaggio per iniziare.</p>
                </div>
            )}

            {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg}/>
            ))}

            {isTyping && <TypingIndicator/>}

            <div ref={bottomRef}/>
        </div>
    )
}

/** 4.1 + 4.2 — ChatInput: textarea + send button, Enter to send, Shift+Enter for newline */
function ChatInput({
                       onSend,
                       disabled,
                       messages,
                   }: {
    onSend: (content: string) => void
    disabled: boolean
    messages: ChatMessage[]
}) {
    const [value, setValue] = useState('')
    const historyIndexRef = useRef<number>(-1)
    const draftRef = useRef<string>('')

    const userMessages = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .reverse()

    const handleSend = () => {
        const trimmed = value.trim()
        if (!trimmed) return
        onSend(trimmed)
        setValue('')
        historyIndexRef.current = -1
        draftRef.current = ''
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
            return
        }

        if (e.key === 'ArrowUp') {
            if (userMessages.length === 0) return
            const nextIndex = historyIndexRef.current + 1
            if (nextIndex >= userMessages.length) return
            if (historyIndexRef.current === -1) {
                draftRef.current = value
            }
            e.preventDefault()
            historyIndexRef.current = nextIndex
            setValue(userMessages[nextIndex])
            return
        }

        if (e.key === 'ArrowDown') {
            if (historyIndexRef.current === -1) return
            const nextIndex = historyIndexRef.current - 1
            e.preventDefault()
            if (nextIndex < 0) {
                historyIndexRef.current = -1
                setValue(draftRef.current)
            } else {
                historyIndexRef.current = nextIndex
                setValue(userMessages[nextIndex])
            }
            return
        }
    }

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
                <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scrivi un messaggio..."
                    disabled={disabled}
                    rows={1}
                    className="flex-1 resize-none rounded-2xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    onClick={handleSend}
                    disabled={disabled || !value.trim()}
                    className="rounded-full bg-indigo-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Invia
                </button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000)

    if (date >= startOfToday) {
        const hh = String(date.getHours()).padStart(2, '0')
        const mm = String(date.getMinutes()).padStart(2, '0')
        return `Oggi ${hh}:${mm}`
    }
    if (date >= startOfYesterday) {
        return 'Ieri'
    }
    const dd = String(date.getDate()).padStart(2, '0')
    const mo = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}/${mo}/${yyyy}`
}

// ---------------------------------------------------------------------------
// ConversationSidebar
// ---------------------------------------------------------------------------

function ConversationSidebar({
    conversations,
    isLoading,
    activeConversationId,
    onSelect,
    onNew,
    onRename,
}: {
    conversations: ConversationItem[]
    isLoading: boolean
    activeConversationId: string | null
    onSelect: (id: string) => void
    onNew: () => void
    onRename: (id: string, currentTitle: string) => void
}) {
    return (
        <div className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 h-full">
            <div className="p-3 border-b border-gray-200">
                <button
                    onClick={onNew}
                    className="w-full text-sm px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
                >
                    + Nuova chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <p className="text-xs text-gray-400 text-center mt-6">Caricamento...</p>
                )}
                {!isLoading && conversations.length === 0 && (
                    <p className="text-xs text-gray-400 text-center mt-6">Nessuna conversazione</p>
                )}
                {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId
                    const titleText = conv.title?.trim() || (conv.preview?.trim() || 'Nuova conversazione')
                    const preview = conv.preview
                        ? conv.preview.length > 40
                            ? conv.preview.slice(0, 40) + '…'
                            : conv.preview
                        : null
                    return (
                        <div
                            key={conv.id}
                            className={`w-full text-left px-3 py-3 border-b border-gray-100 transition ${
                                isActive
                                    ? 'bg-indigo-50'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <button
                                    onClick={() => onSelect(conv.id)}
                                    className="flex-1 min-w-0 text-left"
                                >
                                    <p className={`text-sm truncate ${isActive ? 'text-indigo-700 font-medium' : 'text-gray-800'}`}>
                                        {titleText}
                                    </p>
                                    {preview && (
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{preview}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formatRelativeDate(conv.updatedAt)}
                                    </p>
                                </button>
                                <button
                                    type="button"
                                    aria-label="Rinomina conversazione"
                                    className="text-xs text-gray-500 hover:text-indigo-700"
                                    onClick={() => onRename(conv.id, conv.title)}
                                >
                                    Modifica
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main Chat Page
// ---------------------------------------------------------------------------

export default function ChatPage() {
    const {user, loading} = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Auth guard
    useEffect(() => {
        if (!loading && !user) {
            navigate('/login')
        }
    }, [loading, user, navigate])

    // Selected conversation (in-memory per tab)
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

    // Fetch WS token
    const {data: wsToken, isLoading: tokenLoading, isError: tokenError} = useWsToken()

    // Chat hook
    const {
        messages,
        isTyping,
        isConnected,
        createdConversationId,
        error,
        sendMessage,
        replaceMessages,
    } = useChat(wsToken ?? null)

    // Conversation list
    const {data: conversations = [], isLoading: convsLoading} = useConversations()

    // Default selection: first conversation if none selected in this tab
    useEffect(() => {
        const nextSelected = resolveSelectedConversationId(selectedConversationId, conversations)
        if (nextSelected !== selectedConversationId) {
            setSelectedConversationId(nextSelected)
        }
    }, [conversations, selectedConversationId])

    // If WS creates a new conversation, switch this tab to it
    useEffect(() => {
        if (createdConversationId) {
            setSelectedConversationId(createdConversationId)
            queryClient.invalidateQueries({queryKey: ['conversations']})
        }
    }, [createdConversationId, queryClient])

    // History via REST
    const historyQuery = useQuery({
        queryKey: ['conversation-messages', selectedConversationId],
        enabled: !!selectedConversationId,
        queryFn: () => getConversationMessages(selectedConversationId as string),
        staleTime: 15_000,
    })

    useEffect(() => {
        if (!selectedConversationId) {
            replaceMessages([])
            return
        }

        if (historyQuery.data?.items) {
            replaceMessages(mapHistoryToChatMessages(historyQuery.data.items))
        }
    }, [selectedConversationId, historyQuery.data, replaceMessages])

    // Error display
    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const handleNewConversation = async () => {
        try {
            const created = await createConversation()
            setSelectedConversationId(created.id)
            replaceMessages([])
            queryClient.invalidateQueries({queryKey: ['conversations']})
        } catch {
            toast.error('Impossibile creare una nuova conversazione.')
        }
    }

    const handleRenameConversation = async (id: string, currentTitle: string) => {
        const nextTitle = window.prompt('Nuovo titolo conversazione', currentTitle || '')
        if (!nextTitle || nextTitle.trim() === currentTitle.trim()) {
            return
        }

        try {
            await updateConversationTitle(id, nextTitle)
            queryClient.invalidateQueries({queryKey: ['conversations']})
        } catch {
            toast.error('Impossibile aggiornare il titolo della conversazione.')
        }
    }

    const handleSendMessage = async (content: string) => {
        try {
            let conversationId = selectedConversationId
            if (!conversationId) {
                const created = await createConversation()
                conversationId = created.id
                setSelectedConversationId(conversationId)
            }

            queryClient.invalidateQueries({queryKey: ['conversations']})
            sendMessage(content, conversationId)
            queryClient.invalidateQueries({queryKey: ['conversations']})
        } catch {
            toast.error('Impossibile inviare il messaggio.')
        }
    }

    // Logout
    const handleLogout = async () => {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
        })
        navigate('/login')
    }

    if (tokenError) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 font-medium">Impossibile connettersi al server.</p>
                    <p className="text-gray-500 text-sm mt-1">Ricarica la pagina per riprovare.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 text-sm px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                        Ricarica
                    </button>
                </div>
            </div>
        )
    }

    if (loading || tokenLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-gray-500">Caricamento...</p>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="flex flex-row h-screen bg-gray-50">
            <Toaster position="top-right"/>

            <ConversationSidebar
                conversations={conversations}
                isLoading={convsLoading}
                activeConversationId={selectedConversationId}
                onSelect={setSelectedConversationId}
                onNew={handleNewConversation}
                onRename={handleRenameConversation}
            />

            <div className="flex flex-col flex-1 min-w-0">
                <ChatHeader
                    role={user.role}
                    userEmail={user.email}
                    isConnected={isConnected}
                    onLogout={handleLogout}
                />

                <MessageList messages={messages} isTyping={isTyping}/>

                <ChatInput
                    onSend={(content) => {
                        void handleSendMessage(content)
                    }}
                    disabled={isTyping || historyQuery.isLoading}
                    messages={messages}
                />
            </div>
        </div>
    )
}
