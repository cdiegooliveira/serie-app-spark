# Spark Gym - O registro de treinos sem distrações 🏋️‍♂️

> Um aplicativo web minimalista para registrar cargas, repetições e tempos de cárdio de forma ágil, substituindo cadernos e planilhas sem os atritos de aplicativos complexos.

## 📸 Demonstração da Aplicação
 **Tela Inicial:**
 <img width="1918" height="993" alt="image" src="https://github.com/user-attachments/assets/98fbeb2e-8052-4eff-a4fe-5c7377bacf27" />
 
 **Dashboard de Treino:**
 <img width="1919" height="986" alt="image" src="https://github.com/user-attachments/assets/e92387a1-fd78-4f5c-a028-10b1de894a85" />
 
 **Monetização e Admin:**
 <img width="1919" height="988" alt="image" src="https://github.com/user-attachments/assets/63abcbe7-75c5-4a6f-8c79-68586cc17a39" />
 
 <img width="1919" height="979" alt="image" src="https://github.com/user-attachments/assets/63bd2834-ff8b-47fa-ae4a-ff6154199e46" />

## 🧠 A Dor Escolhida
Anotar treinos em blocos de notas de celular, papel ou em aplicativos repletos de anúncios atrapalha o foco no treino. O negócio resolve isso oferecendo uma interface direta ao ponto, focada unicamente na progressão de carga e tempo de cárdio.

## 📊 Tamanho de Mercado e Business Model Canvas
* **TAM:** Milhões de praticantes de atividades físicas no Brasil que utilizam smartphones.
* **SAM:** Praticantes de musculação e cárdio focados em progressão de sobrecarga.
* **SOM:** Nosso nicho inicial foca nos 100 primeiros usuários que rejeitam aplicativos poluídos e valorizam interfaces limpas.
* **Canvas Resumido:** Proposta de valor baseada em usabilidade ultrarrápida (seleção de cargas por botões em vez de digitação livre); distribuição via fóruns e academias; receita via assinatura Premium (R$ 9,90) para acessar o histórico visual de evolução.

## 🧪 Tese do MVP e o que ficou manual
* **Tese testada:** Usuários engajam melhor e registram treinos com mais frequência em uma interface web rápida baseada em toques, sem precisar baixar um app, e têm interesse em assinar um plano para ver o histórico.
* **O que ficou manual de propósito:** O pagamento da assinatura Premium não foi automatizado. O botão redireciona o lead para o WhatsApp, onde a venda é fechada via Pix e o acesso é liberado manualmente. 

## 🛠️ Construção e O Mega Prompt
A aplicação foi construída com o Lovable utilizando o seguinte fluxo principal de prompt:
> "Crie uma aplicação web responsiva (mobile-first) em Dark mode. O usuário deve ter um Dashboard para registrar exercícios usando botões rápidos de seleção para Carga e Repetições. Adicione um botão 'Evolução' que abra um modal Premium redirecionando para o WhatsApp. Crie uma rota `/admin` com estatísticas totais e lista de leads que clicaram no Premium."

## 🔗 Links
* **Aplicação Publicada:** https://serie-app-spark.lovable.app/
