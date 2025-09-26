async function fetchUzytkownicy() {
  try {
    let status = document.getElementById("filtrowanie-status").value;
    const response = await fetch(`/api/uzytkownicy/${status}`);
    if (!response.ok) throw new Error("Błąd podczas pobierania danych");

    const uzytkownicy = await response.json();

    const tbody = document.getElementById("uzytkownicy-tbody");
    tbody.innerHTML = "";

    uzytkownicy.forEach((user) => {
      const actionBtnClass =
        user.WUIsActive === 1 ? "table-delete-btn" : "table-restore-btn";
      const actionIcon =
        user.WUIsActive === 1 ? "trash-white.png" : "restore-white.png";
      const tr = document.createElement("tr");

      const adminActionsBtn =
        user.WUId === 1
          ? `<button class="table-action-btn table-pass-btn" data-id="${user.WUId}"><img src="../img/white/key-white.png"></button>`
          : `<button class="table-action-btn table-pass-btn" data-id="${user.WUId}"><img src="../img/white/key-white.png"></button>
            <button class="table-action-btn table-edit-btn" data-id="${user.WUId}"><img src="../img/white/edit-white.png"></button>
            <button class="table-action-btn ${actionBtnClass}" data-id="${user.WUId}"><img src="../img/white/${actionIcon}"></button>`;

      tr.innerHTML = `
          <td class="column-id">${user.WUId}</td>
          <td>${user.WULogin}</td>
          <td>${user.WUIsActive ? "✅" : "❌"}</td>
          <td>${new Date(user.WUCreated).toLocaleDateString()}</td>
          <td>${user.RName || ""}</td>
          <td class="column-action-btns">
            <div class="table-action-btns-container">${adminActionsBtn}</div>
        </td>
        `;

      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error("Błąd przy wyświetlaniu użytkowników:", error);
  }
}

document.addEventListener("DOMContentLoaded", fetchUzytkownicy());
document.getElementById("filtrowanie-status").addEventListener("change", () => {
  fetchUzytkownicy();
});

document.getElementById("filtrowanie-dodaj").addEventListener("click", () => {
  window.location.href = "uzytkownik-dodanie.html";
});

document.addEventListener("DOMContentLoaded", () => {
  let uzytkownikId = null;
  const message = document.getElementById("message");

  document.addEventListener("click", (event) => {
    if (event.target.closest(`.table-delete-btn`)) {
      const button = event.target.closest(".table-delete-btn");
      uzytkownikId = button.getAttribute("data-id");
      document.querySelector(".confirm-delete").style.display = "flex";
    } else if (event.target.id === "confirm-delete-tak" && uzytkownikId) {
      fetch(`/api/uzytkownik-usuniecie/${uzytkownikId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((response) => {
        if (response.ok) {
          window.location.reload();
        } else {
          message.textContent = "Błąd podczas usuwania użytkownika";
          message.style.opacity = 1;
          setTimeout(() => {
            message.style.opacity = 0;
          }, 3000);
          console.error("Błąd podczas usuwania użytkownika: ", err);
        }
      });
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(`.table-restore-btn`)) {
      const button = event.target.closest(".table-restore-btn");
      uzytkownikId = button.getAttribute("data-id");
      document.querySelector(".confirm-restore").style.display = "flex";
    } else if (event.target.id === "confirm-restore-tak" && uzytkownikId) {
      fetch(`/api/uzytkownik-przywrocenie/${uzytkownikId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((response) => {
        if (response.ok) {
          window.location.reload();
        } else {
          message.textContent = "Błąd podczas przywracania użytkownika";
          message.style.opacity = 1;
          setTimeout(() => {
            message.style.opacity = 0;
          }, 3000);
          console.error("Błąd podczas przywracania użytkownika: ", err);
        }
      });
    }
  });
});

document
  .getElementById("uzytkownicy-tbody")
  .addEventListener("click", (event) => {
    const editBtn = event.target.closest(".table-edit-btn");
    if (editBtn) {
      const userId = editBtn.getAttribute("data-id");
      window.location.href = `uzytkownik-edycja.html?uzytkownikId=${userId}`;
    }
  });

document.getElementById("confirm-delete-nie").addEventListener("click", () => {
  document.querySelector(".confirm-delete").style.display = "none";
});

document.getElementById("confirm-restore-nie").addEventListener("click", () => {
  document.querySelector(".confirm-restore").style.display = "none";
});
