/**
 * tradehub/validation.js
 * Validação de formulários — TradeHub GPS
 *
 * Placement: End of <head> (com defer)
 * Carregado em: todas as LPs da TradeHub
 *
 * ═══════════════════════════════════════════════════════════════
 *  CONFIGURAÇÃO POR PÁGINA — editar apenas aqui
 *  Chave = pathname da URL (ex: '/lp-promotores/')
 *  Páginas não listadas usam o "default" automaticamente
 * ═══════════════════════════════════════════════════════════════
 */

var VALIDATION_CONFIG = {

  // Padrão aplicado em todas as LPs não listadas abaixo
  default: {
    requireCorporateEmail: true,
    fields: ['name', 'email', 'phone'],
  },

  // Exceções por página
  pages: {
    '/lp-promotores/': {
      requireCorporateEmail: false,
      fields: ['name', 'email', 'phone'],
    },
    '/lp-pdv/': {
      requireCorporateEmail: false,
      fields: ['name', 'phone'], // sem campo email nesta LP
    },
  },

};

// ═══════════════════════════════════════════════════════════════
//  Não editar abaixo desta linha
// ═══════════════════════════════════════════════════════════════

(function () {

  // Resolve config da página atual mesclando com o default
  function getPageConfig() {
    var pathname = window.location.pathname;
    var pageOverride = VALIDATION_CONFIG.pages[pathname] || {};
    return Object.assign({}, VALIDATION_CONFIG.default, pageOverride);
  }

  var cfg = getPageConfig();

  // ── Domínios bloqueados (email corporativo) ──
  var BLOCKED_DOMAINS = new Set([
    'gmail.com','gmial.com','gmai.com','googlemail.com',
    'hotmail.com','hotmail.com.br','outlook.com','outlook.com.br',
    'live.com','live.com.br','msn.com',
    'yahoo.com','yahoo.com.br','ymail.com',
    'icloud.com','me.com','mac.com','aol.com',
    'protonmail.com','proton.me',
    'uol.com.br','terra.com.br','bol.com.br','ig.com.br',
  ]);

  // ── Regras de validação ──
  var RULES = {
    name: function (v) {
      if (!v.trim()) return 'Nome completo é obrigatório.';
      var words = v.replace(/[0-9]/g, '').trim().split(/\s+/).filter(function (w) { return w.length > 0; });
      if (words.length < 2) return 'Insira seu nome completo (nome e sobrenome).';
      return '';
    },
    email: function (v) {
      if (!v.trim()) return 'E-mail corporativo é obrigatório.';
      var at = (v.match(/@/g) || []).length;
      if (at !== 1) return 'Email inválido.';
      var parts = v.split('@'), local = parts[0], domain = parts[1];
      if (!local || local.length > 64) return 'Email inválido.';
      if (local.startsWith('.') || local.endsWith('.') || /\.{2,}/.test(local)) return 'Email inválido.';
      if (!domain || !domain.includes('.') || domain.length > 253) return 'Email inválido.';
      if (cfg.requireCorporateEmail && BLOCKED_DOMAINS.has(domain.toLowerCase())) {
        return 'Por favor, use seu e-mail corporativo.';
      }
      return '';
    },
    phone: function (v) {
      if (!v.trim()) return 'WhatsApp é obrigatório.';
      var d = v.replace(/\D/g, '');
      if (d.length !== 10 && d.length !== 11) return 'Insira o WhatsApp com DDD.';
      if (/^(\d)\1+$/.test(d)) return 'WhatsApp inválido.';
      return '';
    },
  };

  // ── Máscara de telefone ──
  function formatPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (!d.length) return '';
    if (d.length < 2) return d;
    if (d.length === 2) return '(' + d + ')';
    var ddd = d.slice(0, 2), body = d.slice(2);
    if (d.length < 10) return '(' + ddd + ') ' + body;
    if (d.length === 10) return '(' + ddd + ') ' + body.slice(0, 4) + '-' + body.slice(4);
    return '(' + ddd + ') ' + body.slice(0, 5) + '-' + body.slice(5);
  }

  // ── Helper: mostra/oculta erro no campo ──
  function showError(id, msg) {
    var el  = document.getElementById('err-' + id);
    var inp = document.getElementById('f-' + id);
    if (!el || !inp) return;
    el.textContent = msg;
    el.classList.toggle('show', !!msg);
    inp.classList.toggle('error', !!msg);
  }

  // ── Inicializa após DOM pronto ──
  document.addEventListener('DOMContentLoaded', function () {

    // Aplica máscara no telefone
    var phoneInput = document.getElementById('f-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var cur    = this.selectionStart;
        var digits = this.value.slice(0, cur).replace(/\D/g, '').length;
        this.value = formatPhone(this.value);
        var count = 0, pos = 0;
        for (var i = 0; i < this.value.length; i++) {
          if (/\d/.test(this.value[i])) count++;
          if (count === digits) { pos = i + 1; break; }
        }
        this.setSelectionRange(pos || this.value.length, pos || this.value.length);
      });
    }

    // Valida no blur (quando sai do campo)
    cfg.fields.forEach(function (field) {
      var input = document.getElementById('f-' + field);
      if (input && RULES[field]) {
        input.addEventListener('blur', function () {
          showError(field, RULES[field](this.value));
        });
      }
    });

  });

  // ── API pública usada pelo scripts.js no submit ──
  window.Validation = {
    // Valida todos os campos ativos — retorna true se passou em tudo
    validate: function () {
      var valid = true;
      cfg.fields.forEach(function (field) {
        if (!RULES[field]) return;
        var input = document.getElementById('f-' + field);
        var msg   = RULES[field](input ? input.value : '');
        showError(field, msg);
        if (msg) valid = false;
      });
      return valid;
    },
  };

})();
