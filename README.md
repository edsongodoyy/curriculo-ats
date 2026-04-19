# CurrículoATS — Deploy na Vercel

## Estrutura do projeto
```
curriculo-ats/
├── vercel.json          ← configuração da Vercel
├── .env.example         ← variáveis de ambiente (modelo)
├── api/
│   ├── payment.js       ← cria preferência no Mercado Pago
│   └── optimize.js      ← verifica pagamento e chama Claude
└── public/
    └── index.html       ← frontend completo
```

---

## Passo a passo para subir na Vercel

### 1. Criar conta na Vercel
- Acesse vercel.com
- Clique em "Sign Up" e entre com o Google

### 2. Subir o projeto
- No painel da Vercel, clique em "Add New → Project"
- Clique em "Upload" e selecione a pasta `curriculo-ats` inteira
- Clique em "Deploy"

### 3. Configurar variáveis de ambiente
No painel da Vercel, vá em:
**Settings → Environment Variables**

Adicione as 3 variáveis:

| Nome | Valor | Onde obter |
|------|-------|-----------|
| `MP_ACCESS_TOKEN` | APP_USR-xxx... | mercadopago.com.br/developers → Credenciais |
| `ANTHROPIC_API_KEY` | sk-ant-api03-xxx... | console.anthropic.com |
| `SITE_URL` | https://seu-projeto.vercel.app | URL gerada após o deploy |

### 4. Fazer redeploy
Após configurar as variáveis, clique em **Deployments → Redeploy**

---

## Obter as credenciais

### Mercado Pago
1. Acesse: mercadopago.com.br/developers
2. Crie um app em "Suas integrações"
3. Vá em "Credenciais de produção"
4. Copie o "Access Token" (começa com APP_USR-)

### Anthropic (Claude)
1. Acesse: console.anthropic.com
2. Vá em "API Keys"
3. Crie uma nova chave
4. Copie (começa com sk-ant-)

---

## Fluxo do produto (produção)

1. Cliente acessa o site
2. Anexa o currículo em PDF
3. Cola a descrição da vaga
4. Clica em "Otimizar Agora" → R$19,90
5. É redirecionado para o checkout do Mercado Pago
6. Paga (cartão, PIX, boleto)
7. É redirecionado de volta ao site automaticamente
8. O backend verifica o pagamento no MP
9. Chama o Claude com o currículo e a vaga
10. Resultado aparece na tela
11. Cliente baixa o PDF ou DOC

---

## Custo por venda

| Item | Custo |
|------|-------|
| Claude API | ~R$0,50 por currículo |
| Mercado Pago | ~5% = R$1,00 |
| Vercel | Grátis (plano gratuito) |
| **Total de custo** | **~R$1,50** |
| **Receita** | **R$19,90** |
| **Margem bruta** | **~92%** |

---

## Modo demo (para testar)
O site tem um toggle "🧪 Modo Demo" que bypassa pagamento e API.
Use para mostrar o produto para clientes sem gastar nada.
