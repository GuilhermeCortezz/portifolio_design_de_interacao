class OnlineQuiz extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.quizData = [];
  }

  connectedCallback() {
    this.loadQuiz();
  }

  async loadQuiz() {
    this.renderLoading();

    try {
      const response = await fetch("quiz-data.json");

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Arquivo JSON sem questoes validas.");
      }

      this.quizData = data;
      this.render();
    } catch (error) {
      this.renderError(error);
    }
  }

  renderLoading() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: "Poppins", sans-serif;
          background: #fff;
          padding: 1.5rem;
          border: 1px solid var(--line, #d3bea8);
          border-radius: 12px;
          color: var(--ink, #2f241f);
        }
      </style>
      <p>Carregando as questoes da prova...</p>
    `;
  }

  renderError(error) {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: "Poppins", sans-serif;
          background: #fff9f2;
          padding: 1.5rem;
          border: 1px solid var(--accent, #b14f2f);
          border-radius: 12px;
          color: var(--ink, #2f241f);
        }
        strong { color: var(--accent-strong, #7f2f18); }
      </style>
      <p><strong>Nao foi possivel carregar a prova.</strong></p>
      <p>Verifique se o arquivo <code>quiz-data.json</code> esta disponivel e tente novamente.</p>
      <small>${error.message}</small>
    `;
  }

  render() {
    let html = `
      <style>
        :host {
          display: block;
          font-family: "Poppins", sans-serif;
          background: #fff;
          padding: 1.5rem;
          border: 1px solid var(--line, #d3bea8);
          border-radius: 12px;
          color: var(--ink, #2f241f);
        }
        .question-block {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eee;
        }
        .question-block:last-child { border-bottom: none; }
        .question-title {
          font-weight: 600;
          margin-bottom: 0.8rem;
          font-size: 1.1rem;
        }
        .option {
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        input[type="radio"] {
          margin: 0;
          cursor: pointer;
        }
        label {
          cursor: pointer;
          font-size: 0.95rem;
        }
        button {
          padding: 0.6rem 1.2rem;
          background: var(--accent, #b14f2f);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: background 0.2s;
        }
        button:hover {
          background: var(--accent-strong, #7f2f18);
        }
        .result-box {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f9f2ea;
          border-radius: 8px;
          display: none;
        }
        .feedback {
          margin-top: 0.5rem;
          font-size: 0.9rem;
          border-radius: 4px;
        }
        .correct { color: #1c7a4f; font-weight: 600; }
        .wrong { color: #b14f2f; font-weight: 600; }
        .error-msg { color: #b14f2f; margin-bottom: 1rem; font-weight: 600; display: none; }
      </style>
      <div id="quiz-container">
    `;

    this.quizData.forEach((q, qIndex) => {
      html += `
        <div class="question-block" id="qBlock${qIndex}">
          <div class="question-title">${qIndex + 1}. ${q.question}</div>
      `;
      q.options.forEach((opt, optIndex) => {
        const id = `q${qIndex}_opt${optIndex}`;
        html += `
          <div class="option">
            <input type="radio" id="${id}" name="q${qIndex}" value="${optIndex}">
            <label for="${id}">${opt}</label>
          </div>
        `;
      });
      html += `
          <div class="feedback" id="feedback${qIndex}"></div>
        </div>
      `;
    });

    html += `
        <div class="error-msg" id="error-msg">Por favor, responda todas as questões antes de enviar.</div>
        <button id="btn-submit">Corrigir Prova</button>
        <button id="btn-retry" style="display:none;">Fazer Novamente</button>
        <div class="result-box" id="result-box"></div>
      </div>
    `;

    this.shadowRoot.innerHTML = html;
    this.shadowRoot.getElementById("btn-submit").addEventListener("click", () => this.submitQuiz());
    this.shadowRoot.getElementById("btn-retry").addEventListener("click", () => this.retryQuiz());
  }

  submitQuiz() {
    let allAnswered = true;
    let score = 0;
    const resultBox = this.shadowRoot.getElementById("result-box");
    const errorMsg = this.shadowRoot.getElementById("error-msg");

    this.quizData.forEach((q, idx) => {
      const selected = this.shadowRoot.querySelector(`input[name="q${idx}"]:checked`);
      if (!selected) allAnswered = false;
    });

    if (!allAnswered) {
      errorMsg.style.display = "block";
      return;
    }

    errorMsg.style.display = "none";

    this.quizData.forEach((q, idx) => {
      const selected = this.shadowRoot.querySelector(`input[name="q${idx}"]:checked`);
      const selectedVal = Number.parseInt(selected.value, 10);
      const feedbackEl = this.shadowRoot.getElementById(`feedback${idx}`);

      let feedbackHtml = `Resposta dada: <strong>${q.options[selectedVal]}</strong> - `;

      if (selectedVal === q.correct) {
        score += 1;
        feedbackHtml += `<span class="correct">Acertou!</span>`;
      } else {
        feedbackHtml += `<span class="wrong">Errou! A resposta certa era: ${q.options[q.correct]}</span>`;
      }

      feedbackEl.innerHTML = feedbackHtml;

      const inputs = this.shadowRoot.querySelectorAll(`input[name="q${idx}"]`);
      inputs.forEach((input) => {
        input.disabled = true;
      });
    });

    resultBox.innerHTML = `<h3>Sua nota final: ${score} de ${this.quizData.length}</h3>`;
    resultBox.style.display = "block";

    this.shadowRoot.getElementById("btn-submit").style.display = "none";
    this.shadowRoot.getElementById("btn-retry").style.display = "inline-block";
  }

  retryQuiz() {
    this.render();
  }
}

if (!customElements.get("online-quiz")) {
  customElements.define("online-quiz", OnlineQuiz);
}

const headerTemplate = document.createElement("template");
headerTemplate.innerHTML = `
  <style>@import "styles.css";</style>
  <header class="site-header">
    <h1><slot name="title">Portfolio da Disciplina de Design de Interacao</slot></h1>
    <p><slot name="desc">Ambiente para reunir e apresentar os trabalhos desenvolvidos ao longo do semestre.</slot></p>
  </header>
`;

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(headerTemplate.content.cloneNode(true));
  }
}

if (!customElements.get("site-header")) {
  customElements.define("site-header", SiteHeader);
}

const navTemplate = document.createElement("template");
navTemplate.innerHTML = `
  <style>@import "styles.css";</style>
  <nav class="site-nav" aria-label="Menu principal">
    <ul class="menu-list">
      <li><a href="index.html" id="link-index">Apresentacao</a></li>
      <li><a href="editor.html" id="link-editor">Trabalho 1: Editor de Cartoes</a></li>
      <li><a href="trabalho2.html" id="link-trabalho2">Trabalho 2: Prova On-line</a></li>
      <li><a href="trabalho3.html" id="link-trabalho3">Trabalho 3</a></li>
      <li><a href="api-form.html" id="link-api-form">API com Formulario</a></li>
      <li><a href="apis-paralelas.html" id="link-apis-paralelas">3 APIs em Paralelo</a></li>
    </ul>
  </nav>
`;

class SiteNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(navTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    const activeId = this.getAttribute("active");
    if (activeId) {
      const link = this.shadowRoot.getElementById("link-" + activeId);
      if (link) link.setAttribute("aria-current", "page");
    }
  }
}

if (!customElements.get("site-nav")) {
  customElements.define("site-nav", SiteNav);
}

const footerTemplate = document.createElement("template");
footerTemplate.innerHTML = `
  <style>@import "styles.css";</style>
  <footer class="site-footer">
    <p><slot>Disciplina de Design de Interacao - Portfolio academico do semestre 2026.1</slot></p>
  </footer>
`;

class SiteFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(footerTemplate.content.cloneNode(true));
  }
}

if (!customElements.get("site-footer")) {
  customElements.define("site-footer", SiteFooter);
}
