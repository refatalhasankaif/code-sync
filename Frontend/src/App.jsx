import { Editor } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from "y-socket.io";
import { FaGithub } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";

const App = () => {

    const editorRef = useRef(null);

    const [username, setUsername] = useState(() => {
        return new URLSearchParams(window.location.search).get('username') || '';
    });

    const [inputVal, setInputVal] = useState('');
    const [users, setUsers] = useState([]);
    const [connected, setConnected] = useState(false);

    const yDoc = useMemo(() => new Y.Doc(), []);
    const yText = useMemo(() => yDoc.getText('monaco'), [yDoc]);

    const handleMount = (editor) => {
        editorRef.current = editor;
        new MonacoBinding(yText, editorRef.current.getModel(), new Set([editorRef.current]));
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!inputVal.trim()) return;
        setUsername(inputVal.trim());
        window.history.pushState({}, '', '?username=' + inputVal.trim());
    };

    useEffect(() => {
        if (!username) return;

        const socketProvider = new SocketIOProvider('/', 'monaco', yDoc, {
            autoConnect: true,
        });

        socketProvider.socket.on('connect', () => setConnected(true));
        socketProvider.socket.on('disconnect', () => setConnected(false));
        setConnected(socketProvider.socket.connected);

        socketProvider.awareness.setLocalStateField('user', { username });

        const updateUsers = () => {
            const states = Array.from(socketProvider.awareness.getStates().values());
            setUsers(states.filter(s => s.user && s.user.username).map(s => s.user));
        };

        updateUsers();
        socketProvider.awareness.on('change', updateUsers);

        const handleBeforeUnload = () => {
            socketProvider.awareness.setLocalStateField('user', null);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            socketProvider.disconnect();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [username, yDoc]);

    if (!username) {
        return (
            <main className="h-screen w-full bg-[#181818] flex items-center justify-center font-mono">
                <div className="border border-green-900 p-10 w-80 flex flex-col gap-6">
                    <div>
                        <p className="text-green-400 text-xl font-bold mb-1">codesync_</p>
                        <p className="text-green-900 text-xs">enter username to join session</p>
                    </div>
                    <form onSubmit={handleJoin} className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="username"
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            autoFocus
                            className="bg-[#181818] border border-green-900 focus:border-green-400 outline-none text-green-400 text-sm px-3 py-2 font-mono placeholder-green-900 transition-colors"
                        />
                        <button
                            type="submit"
                            className="border border-green-400 text-green-400 hover:bg-green-400 hover:text-black text-sm py-2 font-mono transition-colors cursor-pointer"
                        >
                            join
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col bg-[#181818] font-mono overflow-hidden">

            <header className="h-11 flex items-center justify-between px-4 border-b border-green-950 shrink-0">
                <span className="text-green-400 text-sm font-bold">codesync_</span>
                <div className="flex items-center gap-2">
                    <FaUserCircle size={7} className={connected ? 'fill-green-400 text-green-400' : 'fill-red-500 text-red-500'} />
                    <span className={connected ? 'text-xs text-green-400' : 'text-xs text-red-500'}>
                        {connected ? 'connected' : 'connecting...'}
                    </span>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">

                <aside className="w-48 shrink-0 border-r border-green-950 flex flex-col">

                    <div className="text-green-900 text-xs uppercase tracking-widest px-4 py-3 border-b border-green-950">
                        online — {users.length}
                    </div>

                    <div className="flex-1 overflow-y-auto py-2">
                        {users.length === 0 && (
                            <p className="text-green-950 text-xs px-4 py-2">no one else here</p>
                        )}
                        {users.map((user, i) => (
                            <div key={i} className="flex items-center gap-2 px-4 py-1.5">
                                <span className="text-green-400 text-xs">●</span>
                                <span className={user.username === username ? 'text-green-400 text-xs' : 'text-green-700 text-xs'}>
                                    {user.username}{user.username === username ? ' (you)' : ''}
                                </span>
                            </div>
                        ))}
                    </div>


                    <a href="https://github.com/refatalhasankaif/code-sync"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 border-t border-green-950 text-green-900 hover:text-green-400 text-xs transition-colors"
                    >
                        <FaGithub size={13} />
                        <span>source</span>
                    </a>

                </aside>

                <main className="flex-1 overflow-hidden">
                    <Editor
                        height="100%"
                        language="javascript"
                        theme="vs-dark"
                        defaultValue="// start coding..."
                        onMount={handleMount}
                        options={{
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 22,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            padding: { top: 16 },
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                        }}
                    />
                </main>
            </div>
        </div>
    );

};

export default App;