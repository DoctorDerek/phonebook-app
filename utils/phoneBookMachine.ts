import { assign, createMachine } from "xstate"

export const LOCALSTORAGE_KEY_AUTH = "phonebook-context-key"

export type PhoneBookEntry = {
  id: number
  firstName: string
  lastName: string
  phoneNumber: string
}

const INITIAL_PHONE_BOOK_ENTRIES = [
  {
    id: 1,
    firstName: "Eric",
    lastName: "Elliot",
    phoneNumber: "222-555-6575",
  },
  {
    id: 2,
    firstName: "Steve",
    lastName: "Jobs",
    phoneNumber: "220-454-6754",
  },
  {
    id: 3,
    firstName: "Fred",
    lastName: "Allen",
    phoneNumber: "210-657-9886",
  },
  {
    id: 4,
    firstName: "Steve",
    lastName: "Wozniak",
    phoneNumber: "343-675-8786",
  },
  {
    id: 5,
    firstName: "Bill",
    lastName: "Gates",
    phoneNumber: "343-654-9688",
  },
].sort((a, b) => a.lastName.localeCompare(b.lastName))
// We pre-sort the initial phone book entries before we use them.

const phoneBookMachine = createMachine(
  {
    // Following recommended per https://xstate.js.org/docs/guides/actions.html
    predictableActionArguments: true,
    id: "phoneBook",
    // TypeScript types are generated by the XState VSCode extension:
    tsTypes: {} as import("./phoneBookMachine.typegen").Typegen0,
    schema: {
      // The context (extended state) of the finite state machine:
      context: {} as { phoneBookEntries: PhoneBookEntry[] },
      // The events handled by this fininte state machine:
      events: {} as  // CRUD operations + FINISH + RESET
        | { type: "CREATE"; phoneBookEntry: PhoneBookEntry }
        | {
            type: "READ"
          }
        | { type: "UPDATE"; phoneBookEntry: PhoneBookEntry }
        | { type: "DELETE"; phoneBookEntry: PhoneBookEntry }
        | {
            type: "FINISH"
          }
        | {
            type: "RESET"
          },
    },
    // We start in the "idle" state, expecting a "READ" action to be sent:
    initial: "idle",
    // The initial context (initial state) of the state machine:
    context: {
      phoneBookEntries: INITIAL_PHONE_BOOK_ENTRIES as PhoneBookEntry[],
    },
    states: {
      idle: {
        on: {
          READ: {
            target: "ready",
            // Run these actions on state transition via trigger READ:
            actions: ["readPhoneBookFromLocalStorage"],
          },
        },
      },
      ready: {
        on: {
          CREATE: {
            target: "running",
            // Run these actions on state transition via trigger CREATE:
            actions: ["createPhoneBookEntry"],
          },
          UPDATE: {
            target: "running",
            // Run these actions on state transition via trigger UPDATE:
            actions: ["updatePhoneBookEntry"],
          },
          DELETE: {
            target: "running",
            // Run these actions on state transition via trigger DELETE:
            actions: ["deletePhoneBookEntry"],
          },
          RESET: {
            target: "running",
            // Run these actions on state transition via trigger RESET:
            actions: ["resetPhoneBookEntries"],
          },
        },
      },
      running: {
        on: {
          FINISH: {
            target: "idle",
            // Run these actions on state transition via trigger FINISH:
            actions: ["writePhoneBookToLocalStorage"],
          },
        },
      },
    },
  },
  {
    actions: {
      readPhoneBookFromLocalStorage: assign({
        // We always have to include context and event, even when unused:
        phoneBookEntries: (context, event) => {
          const localStorageString = localStorage.getItem(LOCALSTORAGE_KEY_AUTH)
          if (localStorageString)
            try {
              const localStorageObject = JSON.parse(
                localStorageString
              ) as PhoneBookEntry[]
              // We sort the phone book entries whenever we load them from disk.
              localStorageObject.sort((a, b) =>
                String(a?.lastName).localeCompare(String(b?.lastName))
              )
              return localStorageObject as PhoneBookEntry[]
            } catch (error: any) {
              console.log(error) // Probably a JSON.parse error 😁
            }
          return INITIAL_PHONE_BOOK_ENTRIES
        },
      }),
      createPhoneBookEntry: assign({
        phoneBookEntries: (context, event) => {
          const currentPhoneBookEntries = context.phoneBookEntries
          const newPhoneBookEntry = event.phoneBookEntry
          currentPhoneBookEntries.push(newPhoneBookEntry)
          return currentPhoneBookEntries
        },
      }),
      updatePhoneBookEntry: assign({
        phoneBookEntries: (context, event) => {
          const currentPhoneBookEntries = context.phoneBookEntries
          const updatedPhoneBookEntry = event.phoneBookEntry
          const filteredPhoneBookEntries = currentPhoneBookEntries.filter(
            ({ id }) => id !== updatedPhoneBookEntry.id
          )
          filteredPhoneBookEntries.push(updatedPhoneBookEntry)
          return filteredPhoneBookEntries
        },
      }),
      deletePhoneBookEntry: assign({
        phoneBookEntries: (context, event) => {
          const currentPhoneBookEntries = context.phoneBookEntries
          const deletedPhoneBookEntry = event.phoneBookEntry
          const filteredPhoneBookEntries = currentPhoneBookEntries.filter(
            ({ id }) => id !== deletedPhoneBookEntry.id
          )
          return filteredPhoneBookEntries
        },
      }),
      writePhoneBookToLocalStorage: (context, event) => {
        try {
          localStorage.setItem(
            LOCALSTORAGE_KEY_AUTH,
            JSON.stringify(context.phoneBookEntries)
          )
        } catch (error: any) {
          console.log(error) // Something went horribly, horribly wrong. 🤯
        }
      },
      resetPhoneBookEntries: assign({
        phoneBookEntries: (context, event) => INITIAL_PHONE_BOOK_ENTRIES,
      }),
    },
  }
)

export default phoneBookMachine
