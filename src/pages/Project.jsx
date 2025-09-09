import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../context/user.context';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer';

function SyntaxHighlightedCode(props) {
    const ref = useRef(null);

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current);
            ref.current.removeAttribute('data-highlighted');
        }
    }, [props.className, props.children]);

    return <code {...props} ref={ref} />;
}

const Project = () => {
    const location = useLocation();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(new Set());
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const { user } = useContext(UserContext);
    const messageBox = React.createRef();
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const [webContainer, setWebContainer] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null);

    const handleUserClick = (id) => {
        setSelectedUserId((prevSelectedUserId) => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    };

    function addCollaborators() {
        axios
            .put('/projects/add-user', {
                projectId: location.state.project._id,
                users: Array.from(selectedUserId),
            })
            .then((res) => {
                console.log(res.data);
                setIsModalOpen(false);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const send = () => {
        sendMessage('project-message', {
            message,
            sender: user,
        });
        setMessages((prevMessages) => [...prevMessages, { sender: user, message }]);
        setMessage('');
    };

    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message);
        return (
            <div className="overflow-auto bg-gray-900 text-white rounded-lg p-3 shadow-sm">
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>
        );
    }

    useEffect(() => {
        initializeSocket(project._id);

        if (!webContainer) {
            getWebContainer().then((container) => {
                setWebContainer(container);
                console.log('container started');
            });
        }

        receiveMessage('project-message', (data) => {
            console.log(data);
            if (data.sender._id === 'ai') {
                const message = JSON.parse(data.message);
                webContainer?.mount(message.fileTree);
                if (message.fileTree) {
                    setFileTree(message.fileTree || {});
                }
                setMessages((prevMessages) => [...prevMessages, data]);
            } else {
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        });

        axios.get(`/projects/get-project/${location.state.project._id}`).then((res) => {
            console.log(res.data.project);
            setProject(res.data.project);
            setFileTree(res.data.project.fileTree || {});
        });

        axios.get('/users/all').then((res) => {
            setUsers(res.data.users);
        }).catch((err) => {
            console.log(err);
        });
    }, []);

    function saveFileTree(ft) {
        axios
            .put('/projects/update-file-tree', {
                projectId: project._id,
                fileTree: ft,
            })
            .then((res) => {
                console.log(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight;
    }

    return (
        <main className="h-screen w-screen flex bg-gray-50 font-sans">
            <section className="relative flex flex-col h-screen min-w-80 bg-white shadow-lg">
                <header className="flex justify-between items-center p-4 bg-gray-100 sticky top-0 z-10">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                        <i className="ri-add-fill"></i>
                        <span className="text-sm font-medium">Add Collaborator</span>
                    </button>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                    >
                        <i className="ri-group-fill text-gray-600"></i>
                    </button>
                </header>
                <div className="flex flex-col flex-grow p-4 overflow-hidden">
                    <div
                        ref={messageBox}
                        className="flex flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`max-w-[70%] ${msg.sender._id === user._id.toString() ? 'ml-auto' : ''} flex flex-col p-3 bg-gray-100 rounded-lg shadow-sm`}
                            >
                                <small className="text-xs text-gray-500 mb-1">{msg.sender.email}</small>
                                <div className="text-sm text-gray-800">
                                    {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : <p>{msg.message}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex mt-4">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="flex-grow p-3 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                            type="text"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={send}
                            className="px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>
                <div
                    className={`absolute inset-0 bg-white transition-transform duration-300 ease-in-out ${
                        isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <header className="flex justify-between items-center p-4 bg-gray-100">
                        <h1 className="text-lg font-semibold text-gray-800">Collaborators</h1>
                        <button
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                        >
                            <i className="ri-close-fill text-gray-600"></i>
                        </button>
                    </header>
                    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
                        {project.users &&
                            project.users.map((user) => (
                                <div
                                    key={user._id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200"
                                >
                                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                                        <i className="ri-user-fill"></i>
                                    </div>
                                    <h1 className="text-base font-medium text-gray-800">{user.email}</h1>
                                </div>
                            ))}
                    </div>
                </div>
            </section>

            <section className="flex flex-grow h-full bg-gray-50">
                <div className="min-w-64 bg-gray-100 flex flex-col">
                    <div className="p-4">
                        <h2 className="text-base font-semibold text-gray-800 mb-3">File Explorer</h2>
                        <div className="flex flex-col gap-1">
                            {Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file);
                                        setOpenFiles([...new Set([...openFiles, file])]);
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm text-gray-700"
                                >
                                    <i className="ri-file-line"></i>
                                    <span>{file}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col flex-grow">
                    <div className="flex justify-between p-2 bg-gray-100">
                        <div className="flex gap-1">
                            {openFiles.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentFile(file)}
                                    className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
                                        currentFile === file ? 'bg-white text-gray-800' : 'bg-gray-200 text-gray-600'
                                    } hover:bg-gray-300 transition-colors duration-200`}
                                >
                                    {file}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree);
                                    const installProcess = await webContainer.spawn('npm', ['install']);
                                    installProcess.output.pipeTo(
                                        new WritableStream({
                                            write(chunk) {
                                                console.log(chunk);
                                            },
                                        })
                                    );
                                    if (runProcess) {
                                        runProcess.kill();
                                    }
                                    let tempRunProcess = await webContainer.spawn('npm', ['start']);
                                    tempRunProcess.output.pipeTo(
                                        new WritableStream({
                                            write(chunk) {
                                                console.log(chunk);
                                            },
                                        })
                                    );
                                    setRunProcess(tempRunProcess);
                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url);
                                        setIframeUrl(url);
                                    });
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                            >
                                Run
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-auto bg-white">
                        {fileTree[currentFile] && (
                            <div className="h-full p-4">
                                <pre className="hljs h-full">
                                    <code
                                        className="hljs h-full outline-none"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent,
                                                    },
                                                },
                                            };
                                            setFileTree(ft);
                                            saveFileTree(ft);
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value,
                                        }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '25rem',
                                            counterSet: 'line-numbering',
                                        }}
                                    />
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {iframeUrl && webContainer && (
                    <div className="min-w-96 flex flex-col h-full bg-gray-50">
                        <input
                            type="text"
                            onChange={(e) => setIframeUrl(e.target.value)}
                            value={iframeUrl}
                            className="w-full p-3 bg-gray-100 border-b border-gray-200 text-sm text-gray-700 focus:outline-none"
                        />
                        <iframe src={iframeUrl} className="w-full h-full border-none"></iframe>
                    </div>
                )}
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <header className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Select Collaborators</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                            >
                                <i className="ri-close-fill text-gray-600"></i>
                            </button>
                        </header>
                        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => handleUserClick(user._id)}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200 ${
                                        selectedUserId.has(user._id) ? 'bg-gray-100' : ''
                                    }`}
                                >
                                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                                        <i className="ri-user-fill"></i>
                                    </div>
                                    <h1 className="text-base font-medium text-gray-800">{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Project;