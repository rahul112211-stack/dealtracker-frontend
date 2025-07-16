// Deal Management System
class DealManager {
    constructor() {
        this.deals = this.loadDeals();
        this.form = document.getElementById('deal-form');
        this.dealsList = document.getElementById('deals-list');
        this.emptyState = document.getElementById('empty-state');
        this.successMessage = document.getElementById('success-message');
        
        this.initializeEventListeners();
        this.renderDeals();
    }

    // Initialize event listeners
    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Load deals from localStorage
    loadDeals() {
        try {
            const stored = localStorage.getItem('revenueOS_deals');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading deals from localStorage:', error);
            return [];
        }
    }

    // Save deals to localStorage
    saveDeals() {
        try {
            localStorage.setItem('revenueOS_deals', JSON.stringify(this.deals));
        } catch (error) {
            console.error('Error saving deals to localStorage:', error);
        }
    }

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const deal = {
            id: Date.now().toString(),
            title: formData.get('title').trim(),
            value: parseFloat(formData.get('value')),
            stage: formData.get('stage'),
            probability: parseInt(formData.get('probability')),
            closeDate: formData.get('closeDate'),
            createdAt: new Date().toISOString()
        };

        // Validate deal data
        if (!this.validateDeal(deal)) {
            return;
        }

        // Add deal to the list
        this.deals.unshift(deal);
        this.saveDeals();
        this.renderDeals();
        
        // Reset form and show success message
        this.form.reset();
        this.showSuccessMessage();
    }

    // Validate deal data
    validateDeal(deal) {
        if (!deal.title || !deal.value || !deal.stage || 
            deal.probability === null || deal.probability === undefined || 
            !deal.closeDate) {
            alert('Please fill in all required fields');
            return false;
        }

        if (deal.value < 0) {
            alert('Deal value must be a positive number');
            return false;
        }

        if (deal.probability < 0 || deal.probability > 100) {
            alert('Probability must be between 0 and 100');
            return false;
        }

        return true;
    }

    // Show success message
    showSuccessMessage() {
        this.successMessage.classList.add('show');
        
        setTimeout(() => {
            this.successMessage.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                this.successMessage.classList.remove('show');
                this.successMessage.style.animation = '';
            }, 300);
        }, 3000);
    }

    // Render all deals
    renderDeals() {
        if (this.deals.length === 0) {
            this.dealsList.innerHTML = '';
            this.emptyState.style.display = 'block';
            return;
        }

        this.emptyState.style.display = 'none';
        
        this.dealsList.innerHTML = this.deals
            .map(deal => this.createDealCard(deal))
            .join('');
    }

    // Create deal card HTML
    createDealCard(deal) {
        const formattedValue = this.formatCurrency(deal.value);
        const formattedDate = this.formatDate(deal.closeDate);
        const stageClass = this.getStageClass(deal.stage);
        const stageIcon = this.getStageIcon(deal.stage);

        return `
            <div class="deal-card new">
                <div class="deal-header">
                    <div>
                        <h3 class="deal-title">${this.escapeHtml(deal.title)}</h3>
                        <div class="deal-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Created: ${this.formatDate(deal.createdAt.split('T')[0])}</span>
                        </div>
                    </div>
                    <div class="deal-value">${formattedValue}</div>
                </div>
                
                <div class="deal-details">
                    <div class="deal-detail">
                        <i class="${stageIcon}"></i>
                        <span class="stage-badge ${stageClass}">${deal.stage}</span>
                    </div>
                    
                    <div class="deal-detail">
                        <i class="fas fa-percentage"></i>
                        <span>${deal.probability}% probability</span>
                    </div>
                    
                    <div class="deal-detail">
                        <i class="fas fa-clock"></i>
                        <span>Close: ${formattedDate}</span>
                    </div>
                </div>
                
                <div class="probability-bar">
                    <div class="probability-fill" style="width: ${deal.probability}%"></div>
                </div>
            </div>
        `;
    }

    // Get stage-specific CSS class
    getStageClass(stage) {
        const stageMap = {
            'Discovery': 'stage-discovery',
            'Proposal': 'stage-proposal',
            'Negotiation': 'stage-negotiation',
            'Closed-Won': 'stage-closed-won',
            'Closed-Lost': 'stage-closed-lost'
        };
        return stageMap[stage] || '';
    }

    // Get stage-specific icon
    getStageIcon(stage) {
        const iconMap = {
            'Discovery': 'fas fa-search',
            'Proposal': 'fas fa-file-alt',
            'Negotiation': 'fas fa-handshake',
            'Closed-Won': 'fas fa-trophy',
            'Closed-Lost': 'fas fa-times-circle'
        };
        return iconMap[stage] || 'fas fa-circle';
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // Format date
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        } catch (error) {
            return dateString;
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Statistics Calculator
class StatsCalculator {
    constructor(deals) {
        this.deals = deals;
    }

    getTotalValue() {
        return this.deals.reduce((sum, deal) => sum + deal.value, 0);
    }

    getWeightedValue() {
        return this.deals.reduce((sum, deal) => {
            return sum + (deal.value * deal.probability / 100);
        }, 0);
    }

    getStageBreakdown() {
        const breakdown = {};
        this.deals.forEach(deal => {
            breakdown[deal.stage] = (breakdown[deal.stage] || 0) + 1;
        });
        return breakdown;
    }

    getAverageProbability() {
        if (this.deals.length === 0) return 0;
        const total = this.deals.reduce((sum, deal) => sum + deal.probability, 0);
        return total / this.deals.length;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize deal manager
    const dealManager = new DealManager();
    
    // Set minimum date for close date field to today
    const closeDateField = document.getElementById('deal-close-date');
    if (closeDateField) {
        const today = new Date().toISOString().split('T')[0];
        closeDateField.min = today;
    }
    
    // Add some interactive enhancements
    enhanceUserExperience();
});

// Enhance user experience with additional interactions
function enhanceUserExperience() {
    // Add form field animations
    const formInputs = document.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Add probability slider visual feedback
    const probabilityInput = document.getElementById('deal-probability');
    if (probabilityInput) {
        probabilityInput.addEventListener('input', function() {
            const value = this.value;
            const percentage = (value / 100) * 100;
            this.style.background = `linear-gradient(to right, #4ade80 0%, #4ade80 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
        });
    }

    // Add form validation feedback
    const form = document.getElementById('deal-form');
    if (form) {
        form.addEventListener('input', function(e) {
            if (e.target.checkValidity()) {
                e.target.classList.remove('invalid');
                e.target.classList.add('valid');
            } else {
                e.target.classList.remove('valid');
                e.target.classList.add('invalid');
            }
        });
    }
}

// Export for potential future use
window.DealManager = DealManager;
window.StatsCalculator = StatsCalculator;
