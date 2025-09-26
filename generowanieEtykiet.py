import sys
import random
from datetime import datetime, timedelta
import pyodbc
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QComboBox, QLineEdit, QPushButton, QMessageBox
)


class WeightApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Dodawanie rekordów do MSSQL")
        self.resize(500, 320)

        # Jasny motyw - bootstrap style
        self.setStyleSheet("""
            QWidget {
                font-family: Arial, sans-serif;
                font-size: 14px;
                background-color: #f8f9fa;
                color: #212529;
            }
            QPushButton {
                background-color: #0d6efd;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #0b5ed7;
            }
            QComboBox, QLineEdit {
                padding: 6px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                background-color: white;
                color: #212529;
            }
            QComboBox QAbstractItemView {
                background-color: white;
                selection-background-color: #0d6efd;
                color: #212529;
            }
        """)

        layout = QVBoxLayout()

        # Lista towarów
        self.plu_items = {
            1: "Banan KG",
            2: "Banan Czerwony KG",
            3: "Pomarańcze na sok KG",
            4: "Mandarynki KG",
            5: "Pomarańcze KG",
            6: "Winogrona białe KG",
            7: "Winogrona czerwone KG",
            8: "Arbuz KG",
            9: "Jabłka Red Prince KG",
            10: "Jabłka Champion KG",
            11: "Jabłka Lobo KG",
            12: "Jabłka Ligol KG",
            13: "Gruszka Patent KG",
            14: "Gruszka Klaps KG",
            15: "Gruszka Konferencja KG",
            16: "Śliwki KG",
            17: "Jabłka Gala KG",
            18: "Jabłka zielone Granny Smith KG",
            19: "Truskawki KG",
            20: "Jeżyny KG",
            21: "Porzeczka czerwona KG",
            22: "Pietruszka KG",
            23: "Marchewka KG",
            24: "Ogórki gruntowe KG",
            25: "Pomidory śliwkowe czerwone KG",
            26: "Pomidory śliwkowe żółte KG",
            27: "Pomidory malinowe KG",
            28: "Pomidory Cherry czerwone KG",
            29: "Pomidory Cherry żółte KG",
            30: "Pomidor KG",
            31: "Ziemniaki KG",
            32: "Ziemniaki bataty KG",
            33: "Buraki KG",
            34: "Cebula czerwona KG",
            35: "Cebula KG",
            36: "Imbir KG",
            37: "Kurkuma KG",
            38: "Brukselka KG",
            39: "Ogórki małosolne KG",
            40: "Kapusta kiszona KG"
        }

        layout.addWidget(QLabel("Wybierz towar:"))
        self.plu_combo = QComboBox()
        for plu, name in self.plu_items.items():
            self.plu_combo.addItem(f"{plu} - {name}", plu)
        layout.addWidget(self.plu_combo)

        # Cena jednostkowa z przyciskiem pobierz cenę
        layout.addWidget(QLabel("Cena jednostkowa (PLN):"))
        price_layout = QHBoxLayout()
        self.price_edit = QLineEdit()
        self.price_edit.setPlaceholderText("Podaj cenę jednostkową")
        price_layout.addWidget(self.price_edit)

        self.btn_get_price = QPushButton("Pobierz cenę z bazy")
        self.btn_get_price.clicked.connect(self.pobierz_cene_z_bazy)
        price_layout.addWidget(self.btn_get_price)
        layout.addLayout(price_layout)

        # Waga i przycisk losuj wagę
        layout.addWidget(QLabel("Waga (g):"))
        weight_layout = QHBoxLayout()
        self.weight_edit = QLineEdit()
        self.weight_edit.setPlaceholderText("Wpisz wagę ręcznie lub wylosuj")
        weight_layout.addWidget(self.weight_edit)

        self.btn_random_weight = QPushButton("Losuj wagę")
        self.btn_random_weight.clicked.connect(self.losuj_wage)
        weight_layout.addWidget(self.btn_random_weight)
        layout.addLayout(weight_layout)

        # Przycisk dodaj rekord
        self.btn_add = QPushButton("Dodaj rekord do bazy")
        self.btn_add.clicked.connect(self.dodaj_rekord)
        layout.addWidget(self.btn_add)

        self.setLayout(layout)

    def losuj_wage(self):
        waga = random.randint(100, 1000)
        self.weight_edit.setText(str(waga))

    def pobierz_cene_z_bazy(self):
        plu = self.plu_combo.currentData()
        plu_code = f"{plu:04d}"
        pattern = f"27{plu_code}{'_'*7}"  # 27 + 4 cyfry + 7 znaków podkreślenia (wildcard dla pojedynczego znaku)
        conn_str = (
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=127.0.0.1,9923;'
            'DATABASE=WagiWeb;'
            'UID=sa;'
            'PWD=Pinnex125!;'
        )
        try:
            with pyodbc.connect(conn_str) as conn:
                cursor = conn.cursor()
                sql = """
                SELECT FORMAT(CenaDet * (1 + (CAST(Stawka AS FLOAT) / 10000)) * 100, 'N2') AS Cena
                FROM [MG].dbo.Towar
                WHERE Kod LIKE ?
                """
                cursor.execute(sql, pattern)
                row = cursor.fetchone()
                if row:
                    cena = row.Cena.replace(',', '.')
                    self.price_edit.setText(cena)
                else:
                    QMessageBox.warning(self, "Brak danych", f"Nie znaleziono ceny dla kodu pasującego do wzoru: {pattern}")
        except Exception as e:
            QMessageBox.critical(self, "Błąd bazy danych", f"Wystąpił błąd:\n{e}")

    def dodaj_rekord(self):
        try:
            plu = self.plu_combo.currentData()
            item_name = self.plu_items[plu]

            # Walidacja ceny
            try:
                unit_price = float(self.price_edit.text().replace(',', '.'))
                if unit_price <= 0:
                    raise ValueError
            except ValueError:
                QMessageBox.warning(self, "Błąd", "Podaj poprawną cenę jednostkową (>0).")
                return

            # Walidacja wagi
            try:
                weight = int(self.weight_edit.text())
                if weight <= 0:
                    raise ValueError
            except ValueError:
                QMessageBox.warning(self, "Błąd", "Podaj poprawną wagę w gramach (>0).")
                return

            quantity = 1
            total_price = round(unit_price * weight / 1000)

            # Ustawienia pozostałych pól
            transaction_number = 0
            traceability_code = ""
            scale_number = 0
            before_price = unit_price
            after_price = unit_price
            item_code = transaction_number
            created = datetime.now() + timedelta(minutes=random.randint(5, 120))
            device_id = 1
            shop_name = "Domyślny"
            scale_name = "SM-120"
            scale_hostname = "192.168.10.45"
            clerk_number = 0

            conn_str = (
                'DRIVER={ODBC Driver 17 for SQL Server};'
                'SERVER=127.0.0.1,9923;'
                'DATABASE=WagiWeb;'
                'UID=sa;'
                'PWD=Pinnex125!;'
            )
            conn = pyodbc.connect(conn_str)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO dbo.ReportPluTransactions (
                    TransactionNumber, PluNumber, UnitPrice, Weight, Quantity,
                    TotalPrice, TraceabilityCode, ScaleNumber, BeforePrice,
                    AfterPrice, ItemCode, ItemName, Created, DeviceId,
                    ShopName, ScaleName, ScaleHostname, ClerkNumber
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                transaction_number, plu, unit_price, weight, quantity,
                total_price, traceability_code, scale_number, before_price,
                after_price, item_code, item_name, created, device_id,
                shop_name, scale_name, scale_hostname, clerk_number
            ))

            conn.commit()
            cursor.close()
            conn.close()

            QMessageBox.information(self, "Sukces", f"Rekord dla '{item_name}' dodany poprawnie.")
        except Exception as e:
            QMessageBox.critical(self, "Błąd", f"Wystąpił błąd:\n{e}")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = WeightApp()
    window.show()
    sys.exit(app.exec_())
