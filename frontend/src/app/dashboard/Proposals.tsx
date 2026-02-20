"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import type { NewProposalFormData } from '../../components/modals/NewProposalModal';
import NewProposalModal from '../../components/modals/NewProposalModal';
import ProposalDetailModal from '../../components/modals/ProposalDetailModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import ProposalTemplates from '../../components/proposals/ProposalTemplates';
import ProposalFilters, { type FilterState } from '../../components/proposals/ProposalFilters';
import type { ProposalTemplate } from '../../utils/templates';

interface Proposal {
    id: string;
    title: string;
    description: string;
    status: string;
    creator: string;
    recipient: string;
    createdAt: string;
    approvals: number;
    amount?: string;
}

const Proposals: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNewProposalModal, setShowNewProposalModal] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
    
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        search: '',
        statuses: [],
        dateRange: { from: '', to: '' },
        amountRange: { min: '', max: '' },
        sortBy: 'newest'
    });

    const [newProposalForm, setNewProposalForm] = useState<NewProposalFormData>({
        recipient: '',
        token: '',
        amount: '',
        memo: '',
    });

    useEffect(() => {
        const fetchProposals = async () => {
            setLoading(true);
            try {
                const mockData: Proposal[] = [
                    { id: '1', title: 'Liquidity Pool Expansion', description: 'Adding 100 ETH to LP', status: 'Pending', creator: '0x123', recipient: '0xabc', createdAt: '2026-02-21', approvals: 1, amount: "100" },
                ];
                setProposals(mockData);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchProposals();
    }, []);

    const handleFormChange = (field: keyof NewProposalFormData, value: string) => {
        setNewProposalForm(prev => ({ ...prev, [field]: value }));
    };

    const applyTemplate = (template: ProposalTemplate) => {
        setNewProposalForm({
            recipient: template.recipient,
            token: template.token || "NATIVE",
            amount: template.amount,
            memo: template.memo
        });
        setSelectedTemplateName(template.name);
        setShowTemplateSelector(false);
    };

    const handleCreateProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // API logic...
        setLoading(false);
        setShowNewProposalModal(false);
    };

    // Fix for setRejectingId usage
    const handleOpenReject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent opening the detail modal
        setRejectingId(id);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async (reason?: string) => {
        if (!rejectingId) return;
        const finalReason = reason || "No reason provided";
        console.log(`Rejecting ${rejectingId} for: ${finalReason}`);
        
        // Mock UI update
        setProposals(prev => prev.map(p => p.id === rejectingId ? { ...p, status: 'Rejected' } : p));
        
        setShowRejectModal(false);
        setRejectingId(null);
    };

    const filteredProposals = useMemo(() => {
        return proposals.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(activeFilters.search.toLowerCase()) || 
                                 p.recipient.toLowerCase().includes(activeFilters.search.toLowerCase());
            const matchesStatus = activeFilters.statuses.length === 0 || activeFilters.statuses.includes(p.status);
            return matchesSearch && matchesStatus;
        });
    }, [proposals, activeFilters]);

    return (
        <div className="min-h-screen bg-gray-900 p-6 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Proposals</h1>
                    <button 
                        onClick={() => setShowNewProposalModal(true)}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition"
                    >
                        New Proposal
                    </button>
                </div>

                <ProposalFilters 
                    proposalCount={filteredProposals.length} 
                    onFilterChange={setActiveFilters} 
                />

                <div className="mt-6 space-y-4">
                    {filteredProposals.map(prop => (
                        <div 
                            key={prop.id} 
                            onClick={() => setSelectedProposal(prop)}
                            className="p-4 bg-gray-800 border border-gray-700 rounded-xl cursor-pointer hover:border-purple-500 transition flex justify-between items-center"
                        >
                            <div>
                                <h3 className="text-lg font-semibold">{prop.title}</h3>
                                <p className="text-sm text-gray-400">{prop.status}</p>
                            </div>
                            {prop.status === 'Pending' && (
                                <button 
                                    onClick={(e) => handleOpenReject(e, prop.id)}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                                >
                                    Reject
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {showTemplateSelector && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold">Select Template</h2>
                                <button onClick={() => setShowTemplateSelector(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <ProposalTemplates onUseTemplate={applyTemplate} />
                        </div>
                    </div>
                )}

                <NewProposalModal
                    isOpen={showNewProposalModal}
                    loading={loading}
                    selectedTemplateName={selectedTemplateName}
                    formData={newProposalForm}
                    onFieldChange={handleFormChange}
                    onSubmit={handleCreateProposal}
                    onOpenTemplateSelector={() => setShowTemplateSelector(true)}
                    onSaveAsTemplate={() => {}}
                    onClose={() => setShowNewProposalModal(false)}
                />

                <ProposalDetailModal
                    isOpen={!!selectedProposal}
                    onClose={() => setSelectedProposal(null)}
                    proposal={selectedProposal}
                />

                <ConfirmationModal
                    isOpen={showRejectModal}
                    title="Reject Proposal"
                    message="Are you sure you want to reject this?"
                    onConfirm={handleRejectConfirm}
                    onCancel={() => setShowRejectModal(false)}
                    showReasonInput={true}
                    isDestructive={true}
                />
            </div>
        </div>
    );
};

export default Proposals;