
import React, { useState, DragEvent, useRef } from 'react';
import { LDRState } from '../hooks/useLDRState';
import { Task, TaskStatus, TaskRecurrence } from '../types/index';
import { CloseIcon } from './icons/Icons';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';

const ClockIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4 text-text-secondary" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RecurrenceIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4 text-text-secondary" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M7 9a7 7 0 0110-5 7 7 0 017 7v1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-5h-5M17 15a7 7 0 01-10 5 7 7 0 01-7-7v-1" />
    </svg>
);

const TaskCard: React.FC<{ task: Task; ldrState: LDRState; onCardClick: (task: Task) => void }> = ({ task, ldrState, onCardClick }) => {
    const clientName = ldrState.clients.find(c => c.id === task.clientId)?.name;
    const opportunityTitle = ldrState.opportunities.find(o => o.id === task.opportunityId)?.title;

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('taskId', task.id);
    };

    const getDueDateInfo = (): { className: string; isUrgent: boolean } => {
        if (!task.dueDate || task.status === TaskStatus.Done) {
            return { className: '', isUrgent: false };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = task.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        return {
            className: dueDate < today ? 'border-l-4 border-danger' : '',
            isUrgent: dueDate < today
        };
    };

    const { className: dueDateClass, isUrgent } = getDueDateInfo();

    const formattedDueDate = task.dueDate
        ? new Date(task.dueDate.replace(/-/g, '\/')).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : '';

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={() => onCardClick(task)}
            className={`bg-ui-card p-3 mb-4 rounded-lg border border-ui-border cursor-pointer hover:border-brand-primary transition-all duration-200 active:cursor-grabbing shadow-sm ${dueDateClass}`}
        >
            <h4 className="font-bold text-text-primary text-sm">{task.title}</h4>
            <p className="text-xs text-text-secondary my-2">{task.description}</p>

            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {clientName && <span className="bg-ui-background text-text-secondary border border-ui-border px-2 py-1 rounded-full font-medium">{clientName}</span>}
                {opportunityTitle && <span className="bg-info-light text-info border border-info px-2 py-1 rounded-full font-medium truncate max-w-full">{opportunityTitle}</span>}
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-text-secondary flex-wrap gap-2 pt-2 border-t border-ui-border">
                <div className="flex items-center gap-4">
                    {task.recurrence && task.recurrence !== TaskRecurrence.None && (
                        <span className="flex items-center gap-1 font-medium">
                            <RecurrenceIcon />
                            {task.recurrence}
                        </span>
                    )}
                    {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isUrgent ? 'font-bold text-danger' : ''}`}>
                            <ClockIcon className={`h-4 w-4 ${isUrgent ? 'text-danger' : 'text-text-secondary'}`} />
                            Vence: {formattedDueDate}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{
    status: TaskStatus;
    tasks: Task[];
    ldrState: LDRState;
    onDrop: (status: TaskStatus, taskId: string) => void;
    onCardClick: (task: Task) => void;
}> = ({ status, tasks, ldrState, onDrop, onCardClick }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => setIsOver(false);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        onDrop(status, taskId);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 bg-ui-background rounded-lg p-4 border border-ui-border transition-colors duration-300 ${isOver ? 'bg-brand-primary/10' : ''}`}
        >
            <div className="flex items-center mb-4">
                <h3 className="font-bold text-text-primary">{status}</h3>
                <span className="ml-2 text-sm text-text-secondary bg-ui-hover rounded-full px-2">{tasks.length}</span>
            </div>
            <div className="min-h-[200px]">
                {tasks.map(task => <TaskCard key={task.id} task={task} ldrState={ldrState} onCardClick={onCardClick} />)}
            </div>
        </div>
    );
};

interface KanbanBoardProps {
    ldrState: LDRState;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ ldrState }) => {
    const { tasks, clients, opportunities, updateTaskStatus, addTask, updateTask, updateFunnelActivity } = ldrState;
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [funnelActivityStatuses, setFunnelActivityStatuses] = React.useState<Record<string, TaskStatus>>({});

    // Get current user ID
    React.useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getCurrentUser();
    }, []);

    // Combine regular tasks with funnel activities converted to tasks
    const allTasks: Task[] = React.useMemo(() => {
        if (!currentUserId) return tasks;

        const regularTasks = tasks;

        // Convert funnel activities to tasks (only for current user)
        const funnelActivityTasks: Task[] = opportunities.flatMap(opp =>
            opp.activities
                .filter(act => act.assignedTo === currentUserId) // Only activities assigned to current user
                .map(act => {
                    const activityId = `funnel-${act.id}`;
                    // Use local status if set, otherwise derive from completed
                    const status = funnelActivityStatuses[activityId] ||
                        (act.completed ? TaskStatus.Done : TaskStatus.ToDo);

                    return {
                        id: activityId,
                        title: act.text,
                        description: `${opp.title}`,
                        status,
                        clientId: opp.clientId,
                        opportunityId: opp.id,
                        dueDate: undefined,
                        recurrence: TaskRecurrence.None,
                        userId: act.assignedTo,
                        isFunnelActivity: true,
                        originalActivityId: act.id,
                    };
                })
        );

        return [...regularTasks, ...funnelActivityTasks];
    }, [tasks, opportunities, currentUserId, funnelActivityStatuses]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        description: '',
        clientId: '',
        opportunityId: '',
        dueDate: '',
        recurrence: TaskRecurrence.None,
    });
    const formRef = useRef<HTMLFormElement>(null);

    const today = new Date().toISOString().split('T')[0];

    const handleDrop = (newStatus: TaskStatus, taskId: string) => {
        if (taskId) {
            // Check if it's a funnel activity
            if (taskId.startsWith('funnel-')) {
                // Update local status
                setFunnelActivityStatuses(prev => ({
                    ...prev,
                    [taskId]: newStatus,
                }));

                // If status is Done, also update in backend
                if (newStatus === TaskStatus.Done) {
                    const originalId = taskId.replace('funnel-', '');
                    const opportunity = opportunities.find(opp =>
                        opp.activities.some(act => act.id === originalId)
                    );
                    if (opportunity) {
                        const activity = opportunity.activities.find(act => act.id === originalId);
                        if (activity) {
                            updateFunnelActivity(opportunity.id, {
                                ...activity,
                                completed: true,
                            });
                        }
                    }
                }
            } else {
                // Regular task
                const task = tasks.find(t => t.id === taskId);
                if (task && task.status !== newStatus) {
                    updateTaskStatus(taskId, newStatus);
                }
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
        setTaskFormData({ title: '', description: '', clientId: '', opportunityId: '', dueDate: '', recurrence: TaskRecurrence.None });
    };

    const handleOpenNewModal = () => {
        setEditingTask(null);
        setTaskFormData({ title: '', description: '', clientId: '', opportunityId: '', dueDate: '', recurrence: TaskRecurrence.None });
        setIsModalOpen(true);
    };

    const handleCardClick = (task: Task) => {
        // Don't allow editing funnel activities through the task modal
        if (task.isFunnelActivity) {
            return;
        }

        setEditingTask(task);
        setTaskFormData({
            title: task.title,
            description: task.description,
            clientId: task.clientId || '',
            opportunityId: task.opportunityId || '',
            dueDate: task.dueDate || '',
            recurrence: task.recurrence || TaskRecurrence.None,
        });
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTaskFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskFormData.title) return;

        if (editingTask) {
            updateTask({
                ...editingTask,
                ...taskFormData,
                clientId: taskFormData.clientId || undefined,
                opportunityId: taskFormData.opportunityId || undefined,
                dueDate: taskFormData.dueDate || undefined,
            });
        } else {
            addTask({
                title: taskFormData.title,
                description: taskFormData.description,
                recurrence: taskFormData.recurrence,
                clientId: taskFormData.clientId || undefined,
                opportunityId: taskFormData.opportunityId || undefined,
                dueDate: taskFormData.dueDate || undefined,
            });
        }
        handleCloseModal();
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="mb-6 flex justify-end">
                    <Button
                        onClick={handleOpenNewModal}
                        variant="default"
                        className="font-bold"
                    >
                        + Nova Tarefa
                    </Button>
                </div>
                <div className="flex-1 flex gap-6">
                    {Object.values(TaskStatus).map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={allTasks.filter(t => t.status === status)}
                            ldrState={ldrState}
                            onDrop={handleDrop}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-ui-card p-8 rounded-lg border border-ui-border w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-2xl">
                            <h2 className="text-2xl font-bold text-text-primary mb-6">
                                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                            </h2>
                            <button type="button" onClick={handleCloseModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors" aria-label="Fechar">
                                <CloseIcon />
                            </button>
                            <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Título</label>
                                    <input type="text" name="title" id="title" value={taskFormData.title} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                                    <textarea name="description" id="description" value={taskFormData.description} onChange={handleFormChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"></textarea>
                                </div>
                                <div>
                                    <label htmlFor="clientId" className="block text-sm font-medium text-text-secondary mb-1">Associar ao Cliente (Opcional)</label>
                                    <select name="clientId" id="clientId" value={taskFormData.clientId} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        <option value="">Nenhum cliente</option>
                                        {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="opportunityId" className="block text-sm font-medium text-text-secondary mb-1">Associar à Oportunidade (Opcional)</label>
                                    <select name="opportunityId" id="opportunityId" value={taskFormData.opportunityId} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        <option value="">Nenhuma oportunidade</option>
                                        {opportunities.map(opp => <option key={opp.id} value={opp.id}>{opp.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-text-secondary mb-1">Vencimento (Opcional)</label>
                                    <input type="date" name="dueDate" id="dueDate" value={taskFormData.dueDate} onChange={handleFormChange} min={today} className="mt-1 block w-full px-3 py-2 bg-white border border-ui-border rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                                </div>
                                <div>
                                    <label htmlFor="recurrence" className="block text-sm font-medium text-text-secondary mb-1">Recorrência</label>
                                    <select name="recurrence" id="recurrence" value={taskFormData.recurrence} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-ui-border bg-white rounded-md shadow-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                        {Object.values(TaskRecurrence).map(rec => <option key={rec} value={rec}>{rec}</option>)}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-ui-border">
                                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-ui-card text-text-secondary border border-ui-border rounded-md hover:bg-ui-hover">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90">
                                        {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanBoard;