# Fair Turn demo sandbox

Open `https://fair-turn.sociobot.in/demo` or use “Try it with sample data” on
the first screen. `/?demo=1` is also accepted for catalog compatibility.

The demo opens Juniper House with Avery, Morgan, and Riley; three recurring
chores; Morgan’s current trip; and three realistic history entries. The first
screen is already a working board.

Demo data uses the separate IndexedDB database `fair-turn-demo`. Real household
data remains in `fair-turn` and is never opened while demo mode is active.
License storage and verification are also skipped in demo mode. “Reset demo”
replaces only the sample database. “Start for real” deletes that database and
returns to the real local board.
