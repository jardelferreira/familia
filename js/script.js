/**
 * PWA Mobilidade - Script Principal Otimizado
 * Versão: 2.0
 * Data: 2025-07-14
 */

// ===== CONFIGURAÇÕES E CONSTANTES =====
const APP_NAME = "familia";
const CONFIG = {
    APP_NAME: APP_NAME,
    DB_NAME: "familia_mobilidadeDB",
    DB_VERSION: 2,
    STORES: {
        LOCALIDADES: "localidades",
        ROTAS: "rotas",
        META: "metadados"
    },
    URLS: {
        LOCAL_JSON: `https://cdn.jsdelivr.net/gh/jardelferreira/${APP_NAME}@main/localidades.json?nocache=${Date.now()}`,
        LOCAL_ROTAS: `https://cdn.jsdelivr.net/gh/jardelferreira/${APP_NAME}@main/novas_rotas_1753636365974.json?nocache=${Date.now()}`,
        REMOTE_CSV: `https://script.google.com/macros/s/AKfycbz5Cj8mcYEfHtrGwER4xZEVT_xDe7ov4sth7m3hgaB30-6n-9DqcuZZW5UZyPW1pRhc/exec?action=localidades`,
        ADICIONAIS: `https://script.google.com/macros/s/AKfycbz5Cj8mcYEfHtrGwER4xZEVT_xDe7ov4sth7m3hgaB30-6n-9DqcuZZW5UZyPW1pRhc/exec?action=getAdicionais&nocache=${Date.now()}`
    },
    CACHE_HOURS: 24,
    TOAST_DURATION: 4000,
    ANIMATION_DELAY: 200
};

// ===== VARIÁVEIS GLOBAIS =====
let LOCALIDADES = [];
let ROTAS_EDITADAS = [];
let ADICIONAIS = [];
let dbInstance = null;

// ===== UTILITÁRIOS =====
class Utils {
    static padronizarLocalidades(localidades) {
        return localidades.map(loc => ({
            i: loc.id || loc.ID,
            local: loc.local || `${loc.LOCAL}, ${loc.BAIRRO}, ${loc.CIDADE}-${loc.UF}`
        }));
    }

    static dadosExpiraram(timestamp, maxHoras = CONFIG.CACHE_HOURS) {
        return (Date.now() - timestamp) > (maxHoras * 3600 * 1000);
    }

    static formatarValor(valor) {
        return valor.toFixed(2).replace('.', ',');
    }

    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    // Atualizar indicador visual do tema atual
    atualizarIndicadorTema(theme) {
        // Remove marcador de todos os botões
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.remove('theme-active');
        });

        // Adiciona marcador ao tema atual
        const currentBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (currentBtn) {
            currentBtn.classList.add('theme-active');
        }
    }

    // Inicializar tema na aplicação
    inicializar() {
        const savedTheme = this.carregarTema();
        this.aplicarTema(savedTheme);

        // Configurar eventos dos botões de tema
        this.configurarEventosTema();
    }

    // Configurar eventos dos botões de tema
    configurarEventosTema() {
        document.querySelectorAll('[data-theme]').forEach(button => {
            button.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.aplicarTema(theme);
                UIManager.hideElement('themeSelector');
            });
        });
    }

    // Alternar para próximo tema (útil para atalhos)
    alternarProximoTema() {
        const currentTheme = this.carregarTema();
        const currentIndex = this.availableThemes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % this.availableThemes.length;
        const nextTheme = this.availableThemes[nextIndex];

        this.aplicarTema(nextTheme);
        return nextTheme;
    }

    // Resetar para tema padrão
    resetarTema() {
        this.aplicarTema(this.defaultTheme);
    }
}

// ===== GERENCIADOR DE TEMAS =====
class ThemeManager {
    constructor() {
        this.storageKey = `${CONFIG.APP_NAME}-mobilidade-theme`;
        this.defaultTheme = 'default';
        this.availableThemes = ['default', 'orange2', 'blue', 'green', 'purple', 'orange', 'red', 'pink', 'yellow', 'gray'];
    }

    // Salvar tema no localStorage
    salvarTema(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
            console.log(`✅ Tema '${theme}' salvo`);
        } catch (error) {
            console.warn('⚠️ Erro ao salvar tema:', error);
        }
    }

    // Carregar tema do localStorage
    carregarTema() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            return this.availableThemes.includes(savedTheme) ? savedTheme : this.defaultTheme;
        } catch (error) {
            console.warn('⚠️ Erro ao carregar tema:', error);
            return this.defaultTheme;
        }
    }

    // Aplicar tema ao documento
    aplicarTema(theme) {
        if (!this.availableThemes.includes(theme)) {
            console.warn(`⚠️ Tema '${theme}' não está disponível`);
            theme = this.defaultTheme;
        }

        document.body.className = `bg-gray-50 theme-${theme}`;
        this.salvarTema(theme);

        // Atualizar indicador visual se existir
        this.atualizarIndicadorTema(theme);

        console.log(`🎨 Tema aplicado: ${theme}`);
    }

    // Atualizar indicador visual do tema atual
    atualizarIndicadorTema(theme) {
        // Remove marcador de todos os botões
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.remove('theme-active');
        });

        // Adiciona marcador ao tema atual
        const currentBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (currentBtn) {
            currentBtn.classList.add('theme-active');
        }
    }

    // Inicializar tema na aplicação
    inicializar() {
        const savedTheme = this.carregarTema();
        this.aplicarTema(savedTheme);

        // Configurar eventos dos botões de tema
        this.configurarEventosTema();
    }

    // Configurar eventos dos botões de tema
    configurarEventosTema() {
        document.querySelectorAll('[data-theme]').forEach(button => {
            button.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.aplicarTema(theme);
                UIManager.hideElement('themeSelector');
            });
        });
    }

    // Alternar para próximo tema (útil para atalhos)
    alternarProximoTema() {
        const currentTheme = this.carregarTema();
        const currentIndex = this.availableThemes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % this.availableThemes.length;
        const nextTheme = this.availableThemes[nextIndex];

        this.aplicarTema(nextTheme);
        return nextTheme;
    }

    // Resetar para tema padrão
    resetarTema() {
        this.aplicarTema(this.defaultTheme);
    }
}
// ===== GERENCIADOR DE BANCO DE DADOS =====
class DatabaseManager {
    constructor() {
        this.db = null;
    }

    async abrir() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Criar stores se não existirem
                Object.values(CONFIG.STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        if (storeName === CONFIG.STORES.META) {
                            db.createObjectStore(storeName);
                        } else {
                            db.createObjectStore(storeName, { keyPath: "i" });
                        }
                    }
                });
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onerror = () => {
                reject(new Error("Erro ao abrir IndexedDB"));
            };
        });
    }

    async salvarComTimestamp(storeName, dados) {
        const db = await this.abrir();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([storeName, CONFIG.STORES.META], "readwrite");
            const store = tx.objectStore(storeName);
            const meta = tx.objectStore(CONFIG.STORES.META);

            // Limpar store anterior
            store.clear();

            // Adicionar dados
            if (Array.isArray(dados)) {
                dados.forEach(item => store.put(item));
            } else {
                store.put(dados);
            }

            // Salvar timestamp
            meta.put(Date.now(), storeName);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error(`Erro ao salvar em ${storeName}`));
        });
    }

    async carregarDados(storeName) {
        const db = await this.abrir();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.getAll();

            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(new Error(`Erro ao ler dados de ${storeName}`));
        });
    }

    async obterTimestamp(storeName) {
        const db = await this.abrir();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(CONFIG.STORES.META, "readonly");
            const store = tx.objectStore(CONFIG.STORES.META);
            const req = store.get(storeName);

            req.onsuccess = () => resolve(req.result || 0);
            req.onerror = () => reject(new Error(`Erro ao ler timestamp de ${storeName}`));
        });
    }

    async limparTudo() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }

        return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(CONFIG.DB_NAME);
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => reject(new Error("Erro ao limpar banco"));
        });
    }
}

// ===== GERENCIADOR DE DADOS =====
class DataManager {
    constructor() {
        this.db = new DatabaseManager();
    }

    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await Utils.delay(1000 * (i + 1)); // Backoff exponencial
            }
        }
    }

    async inicializar() {
        try {
            await this.carregarLocalidades();
            await this.carregarRotas();
            await this.carregarAdicionais();
            console.log("✅ Dados inicializados com sucesso");
        } catch (error) {
            console.error("❌ Erro na inicialização:", error);
            throw error;
        }
    }

    async carregarLocalidades() {
        const timestamp = await this.db.obterTimestamp(CONFIG.STORES.LOCALIDADES);

        if (!timestamp || Utils.dadosExpiraram(timestamp)) {
            console.log("🟡 Atualizando LOCALIDADES (expirado ou inexistente)");
            const response = await this.fetchWithRetry(CONFIG.URLS.REMOTE_CSV);
            const dados = await response.json();

            const localidades = Utils.padronizarLocalidades(dados);
            await this.db.salvarComTimestamp(CONFIG.STORES.LOCALIDADES, localidades);
            LOCALIDADES = localidades;
        } else {
            LOCALIDADES = await this.db.carregarDados(CONFIG.STORES.LOCALIDADES);
            console.log("🟢 LOCALIDADES carregadas do cache");
        }
    }

    async carregarRotas() {
        const timestamp = await this.db.obterTimestamp(CONFIG.STORES.ROTAS);

        if (!timestamp || Utils.dadosExpiraram(timestamp)) {
            console.log("🟡 Atualizando ROTAS (expirado ou inexistente)");
            const response = await this.fetchWithRetry(CONFIG.URLS.LOCAL_ROTAS);
            const rotas = await response.json();
            await this.db.salvarComTimestamp(CONFIG.STORES.ROTAS, rotas);
            ROTAS_EDITADAS = rotas;
        } else {
            ROTAS_EDITADAS = await this.db.carregarDados(CONFIG.STORES.ROTAS);
            console.log("🟢 ROTAS carregadas do cache");
        }
    }

    async carregarAdicionais() {
        try {
            const response = await this.fetchWithRetry(CONFIG.URLS.ADICIONAIS);
            const adicionais = await response.json();
            ADICIONAIS = JSON.parse(adicionais.data)
            console.log("✅ ADICIONAIS carregados");
        } catch (error) {
            console.warn("⚠️ Erro ao carregar adicionais:", error);
            ADICIONAIS = [];
        }
    }

    async atualizarTudo() {
        try {
            // Forçar atualização removendo os dados do cache
            await this.carregarLocalidades();
            await this.carregarRotas();
            await this.carregarAdicionais();

            console.log("✅ Todos os dados foram atualizados");
            return true;
        } catch (error) {
            console.error("❌ Erro ao atualizar dados:", error);
            return false;
        }
    }
}

// ===== GERENCIADOR DE UI =====
class UIManager {
    static mostrarToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = mensagem;
        toast.className = `toast show ${tipo}`;

        setTimeout(() => {
            toast.className = 'toast';
        }, CONFIG.TOAST_DURATION);
    }

    static toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle('hidden');
        }
    }

    static hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    static showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('hidden');
        }
    }

    static async animarEntrada() {
        const elements = document.querySelectorAll('.slide-in');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * CONFIG.ANIMATION_DELAY);
        });
    }

    static async toggleLoading(elementId, isLoading = true) {
        const element = document.getElementById(elementId);
        if (!element) return;
        UIManager.toggleElement(elementId);
    }
}

// ===== CALCULADORA DE VIAGEM =====
class CalculadoraViagem {
    constructor() {
        this.operacoes = {
            '+': (base, valor) => base + parseFloat(valor),
            '-': (base, valor) => base - parseFloat(valor),
            '*': (base, valor) => base * parseFloat(valor),
            '/': (base, valor) => base / parseFloat(valor),
            '%': (base, valor) => base + (base * parseFloat(valor) / 100)
        };
    }

    calcular() {
        const origem = document.getElementById('origem')?.value;
        const destino = document.getElementById('destino')?.value;
        const valorTotalElement = document.getElementById('valorTotal');

        if (!origem || !destino || !valorTotalElement) {
            UIManager.mostrarToast("Selecione origem e destino!", "error");
            return;
        }

        try {
            const rotaOrigem = ROTAS_EDITADAS.find(rota => rota.i == origem);
            if (!rotaOrigem) {
                throw new Error("Origem não encontrada");
            }

            const rotaDestino = rotaOrigem.r.find(rota => rota[0] == destino);
            if (!rotaDestino) {
                throw new Error("Destino não encontrado");
            }
            const valorBase = parseFloat(rotaDestino[1]);
            if (isNaN(valorBase) || valorBase <= 0) {
                throw new Error("Valor inválido para esta rota");
            }

            let valorFinal = valorBase;
            const adicionaisSelecionados = document.querySelectorAll('.optional-check:checked');

            adicionaisSelecionados.forEach(checkbox => {
                const indice = parseInt(checkbox.value);
                const adicional = ADICIONAIS[indice];

                if (adicional && this.operacoes[adicional.operacao]) {
                    valorFinal = this.operacoes[adicional.operacao](valorFinal, adicional.valor);
                }
            });

            valorTotalElement.textContent = Utils.formatarValor(valorFinal);
            UIManager.mostrarToast(`Valor calculado: R$ ${Utils.formatarValor(valorFinal)}`, "success");

        } catch (error) {
            console.error("Erro no cálculo:", error);
            valorTotalElement.textContent = "0,00";
            UIManager.mostrarToast(error.message, "error");
        }
    }
}

// ===== GERENCIADOR DE SELETORES =====
class SeletorManager {
    constructor() {
        this.calculadora = new CalculadoraViagem();
        this.debouncedCalcular = Utils.debounce(() => this.calculadora.calcular(), 300);
    }

    carregarOrigens() {
        const select = document.getElementById('origem');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione a origem</option>';

        LOCALIDADES.forEach(local => {
            const option = document.createElement('option');
            option.value = local.i;
            option.textContent = local.local;
            select.appendChild(option);
        });

        // Inicializar Select2 se disponível
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $(select).select2({
                placeholder: "Selecione a origem",
                theme: "bootstrap-custom",
                matcher: function (params, data) {
                    return customMatcher(params, data);
                }
            }).on('change', () => {
                this.carregarDestinos(select.value);
                this.resetarValor();
            });
        } else {
            select.addEventListener('change', () => {
                this.carregarDestinos(select.value);
                this.resetarValor();
            });
        }
    }

    carregarDestinos(origemId) {
        console.log(origemId)
        const select = document.getElementById('destino');
        if (!select || !origemId) return;

        select.innerHTML = '<option value="">Selecione o destino</option>';

        const rotaOrigem = ROTAS_EDITADAS.find(rota => rota.i == origemId);
        if (!rotaOrigem) return;

        rotaOrigem.r.forEach(destino => {
            const localidade = LOCALIDADES.find(local => local.i == destino[0]);
            if (localidade) {
                const option = document.createElement('option');
                option.value = destino[0];
                option.textContent = localidade.local;
                select.appendChild(option);
            }
        })

        // Inicializar Select2 se disponível
        if (typeof $ !== 'undefined' && $.fn.select2) {
            $(select).select2({
                placeholder: "Selecione o destino",
                theme: "bootstrap-custom",
                matcher: function (params, data) {
                    return customMatcher(params, data)
                }
            }).on('change', () => {
                this.debouncedCalcular();
            });
        } else {
            select.addEventListener('change', () => {
                this.debouncedCalcular();
            });
        }
    }

    carregarAdicionais() {
        const lista = document.getElementById('optionalsList');
        if (!lista) return;

        lista.innerHTML = '';

        ADICIONAIS.forEach((adicional, index) => {
            const item = this.criarItemAdicional(adicional, index);
            lista.appendChild(item);
        });
    }

    criarItemAdicional(adicional, index) {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between option-item';

        item.innerHTML = `
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" class="checkbox-custom mr-3 optional-check" 
                            value="${index}" data-valor="${adicional.valor}" data-operacao="${adicional.operacao}">
                        <span class="text-sm text-gray-700">${adicional.nome}</span>
                    </label>
                    <div class="flex items-center gap-2">
                        <button type="button" class="info-btn text-blue-600 text-lg" 
                                title="Mais informações" 
                                onclick="abrirModalInfo('${adicional.nome}', '${adicional.descricao.replace(/'/g, "\\'")}')">
                            ℹ️
                        </button>
                        <span class="text-sm text-gray-500">${adicional.valor}${adicional.operacao}</span>
                    </div>
                `;


        const checkbox = item.querySelector('.optional-check');
        checkbox.addEventListener('change', () => {
            this.debouncedCalcular();
        });

        return item;
    }

    resetarValor() {
        const valorElement = document.getElementById('valorTotal');
        if (valorElement) {
            valorElement.textContent = "0,00";
        }
    }
}

// ===== APLICAÇÃO PRINCIPAL =====
class AppMobilidade {
    constructor() {
        this.dataManager = new DataManager();
        this.seletorManager = new SeletorManager();
        this.themeManeger = new ThemeManager();
        this.inicializado = false;
    }

    async inicializar() {
        try {
            this.themeManeger.inicializar()
            UIManager.mostrarToast("Carregando dados...", "info");

            await this.dataManager.inicializar();
            this.seletorManager.carregarOrigens();
            this.seletorManager.carregarAdicionais();

            this.configurarEventos();
            await UIManager.animarEntrada();

            this.inicializado = true;
            UIManager.mostrarToast("Aplicativo carregado com sucesso!", "success");

        } catch (error) {
            console.error("Erro na inicialização:", error);
            UIManager.mostrarToast("Erro ao carregar aplicativo", "error");
        }
    }
    obterThemeManager() {
        return this.themeManager;
    }
    configurarEventos() {
        // Eventos de clique fora para fechar seletores
        document.addEventListener('click', (event) => {
            const themeSelector = document.getElementById('themeSelector');
            const configSelector = document.getElementById('configSelector');

            if (themeSelector && !themeSelector.contains(event.target) &&
                !event.target.closest('button[onclick="toggleTheme()"]')) {
                UIManager.hideElement('themeSelector');
            }

            if (configSelector && !configSelector.contains(event.target) &&
                !event.target.closest('button[onclick="toggleConfig()"]')) {
                UIManager.hideElement('configSelector');
            }
        });

        // Animação de entrada quando a página carrega
        window.addEventListener('load', () => {
            UIManager.animarEntrada();
        });
    }

    async forcarAtualizacao(targetId) {
        if (!this.inicializado) return;

        try {
            UIManager.toggleLoading(targetId, true);

            const sucesso = await this.dataManager.atualizarTudo();

            if (sucesso) {
                this.seletorManager.carregarOrigens();
                this.seletorManager.carregarAdicionais();

                UIManager.mostrarToast("Dados atualizados com sucesso ✅", "success");
            } else {
                UIManager.mostrarToast("Erro ao atualizar dados ❌", "error");
            }

        } catch (error) {
            console.error("Erro ao forçar atualização:", error);
            UIManager.mostrarToast("Erro ao atualizar dados ❌", "error");
        }
    }

    async limparTudoPWA(targetId) {
        try {
            UIManager.toggleLoading(targetId, true);
            const temaAtual = this.themeManeger.carregarTema();
            // Limpar localStorage e sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            this.themeManeger.aplicarTema(temaAtual);
            // Limpar IndexedDB
            await this.dataManager.db.limparTudo();

            // Limpar CacheStorage
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }

            // Desregistrar service workers
            // if ('serviceWorker' in navigator) {
            //     const registrations = await navigator.serviceWorker.getRegistrations();
            //     for (const registration of registrations) {
            //         await registration.unregister();
            //     }
            // }

            UIManager.mostrarToast("✅ Dados limpos com sucesso!", 'success');

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Erro ao limpar PWA:', error);
            UIManager.mostrarToast("❌ Erro ao limpar dados", 'error');
        }
    }

    compartilharWhatsApp() {
        const origemSelect = document.getElementById('origem');
        const destinoSelect = document.getElementById('destino');
        const valorElement = document.getElementById('valorTotal');

        if (!origemSelect || !destinoSelect || !valorElement) return;

        const origem = origemSelect.selectedOptions[0]?.text || 'Não selecionado';
        const destino = destinoSelect.selectedOptions[0]?.text || 'Não selecionado';
        const valor = valorElement.textContent;

        if (valor === '0,00') {
            UIManager.mostrarToast('Selecione origem e destino antes de compartilhar.', 'error');
            return;
        }

        const opcionais = Array.from(document.querySelectorAll('.optional-check:checked'))
            .map(checkbox => `- *${checkbox.nextElementSibling.textContent}*: ${checkbox.getAttribute("data-valor")} ${checkbox.getAttribute("data-operacao")}`)
            .join(', \n') || 'Nenhum';

        const mensagem = `🚌 *Consulta de Viagem*\n\n` +
            `📍 *Origem:* ${origem}\n` +
            `🎯 *Destino:* ${destino}\n` +
            `💰 *Valor:* R$ ${valor}\n` +
            `⚙️ *Opcionais:*\n ${opcionais}\n` +
            `Gostaria de mais informações sobre esta viagem!`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
    }
}

// ===== FUNÇÕES GLOBAIS PARA COMPATIBILIDADE =====
let app = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    app = new AppMobilidade();
    await app.inicializar();
    // Remove o preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.transition = 'opacity 0.5s';
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 1000);
    }
    $("#origem, #destino").on("select2:open", function () {
        setTimeout(() => {
            document.getElementById("origem").scrollIntoView({ behavior: 'smooth' });
        }, 500);
    })
});

// Funções expostas globalmente para compatibilidade com HTML
window.toggleTheme = () => UIManager.toggleElement('themeSelector');
window.toggleConfig = () => UIManager.toggleElement('configSelector');
window.toggleOptionals = () => {
    const content = document.getElementById('optionalsContent');
    const icon = document.getElementById('collapseIcon');

    if (content) {
        UIManager.toggleElement('optionalsContent');

        if (icon) {
            const isHidden = content.classList.contains('hidden');
            icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
};

window.changeTheme = (theme) => {
    if (app && app.themeManager) {
        app.themeManager.aplicarTema(theme);
    } else {
        // Fallback para compatibilidade
        document.body.className = `bg-gray-50 theme-${theme}`;
        try {
            localStorage.setItem('mobilidade-theme', theme);
        } catch (e) {
            console.warn('Erro ao salvar tema:', e);
        }
    }
    UIManager.hideElement('themeSelector');
};

window.toggleThemeKeyboard = () => {
    if (app && app.themeManager) {
        const newTheme = app.themeManager.alternarProximoTema();
        UIManager.mostrarToast(`Tema alterado para: ${newTheme}`, "info");
    }
};

window.shareWhatsApp = () => {
    if (app) app.compartilharWhatsApp();
};

window.forcarAtualizacao = (target) => {
    if (app) app.forcarAtualizacao(target);
};

window.limparTudoPWA = (target) => {
    if (app) app.limparTudoPWA(target);
};

window.calcularValorViagem = () => {
    if (app && app.seletorManager) {
        app.seletorManager.calculadora.calcular();
    }
};

// Função para compatibilidade com toast
window.mostrarToast = UIManager.mostrarToast;

function removerAcentos(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .toLowerCase();
} function customMatcher(params, data) {
    if (!params.term || params.term.trim() === '') return data;

    const termo = removerAcentos(params.term);
    const texto = removerAcentos(data.text || '');

    // Divide o termo em palavras
    const palavras = termo.split(/\s+/);

    // Verifica se todas as palavras existem no texto
    const todasEncontradas = palavras.every(palavra => texto.includes(palavra));

    return todasEncontradas ? data : null;
}

function abrirModalInfo(titulo, descricao) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-descricao').textContent = descricao;
    document.getElementById('modal-info').classList.remove('hidden');
}

function fecharModalInfo() {
    document.getElementById('modal-info').classList.add('hidden');
}


console.log("🚀 PWA Mobilidade v2.0 inicializado");