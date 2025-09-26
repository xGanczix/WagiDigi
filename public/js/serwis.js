function kolorujLogi(logText) {
  const lines = logText.replace(/\r/g, "").split("\n");
  return lines
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const match = line.match(/^\[(.*?)\] \[(.*?)\] (.*)$/);
      if (match) {
        const [, data, level, message] = match;
        let color;
        switch (level) {
          case "INFO":
            color = "green";
            break;
          case "WARNING":
            color = "orange";
            break;
          case "ERROR":
            color = "red";
            break;
          default:
            color = "gray";
        }
        return `
          <div style="margin-bottom: 1em;">
            <span style="color: #007bff">[${data}]</span>
            <span style="color: ${color};">[${level}]</span>
            <span> ${message}</span>
          </div>
        `;
      } else {
        return `<div>${line}</div>`;
      }
    })
    .join("");
}

fetch(`${CONFIG.URL}/api/logs`)
  .then((res) => res.json())
  .then((files) => {
    const list = document.getElementById("log-list");
    files.forEach((file) => {
      const li = document.createElement("li");
      li.textContent = file;
      li.onclick = () => {
        fetch(`/api/logs/${file}`)
          .then((res) => res.text())
          .then((content) => {
            document.getElementById("log-content").innerHTML =
              kolorujLogi(content);
          });
      };

      list.appendChild(li);
    });
  });
