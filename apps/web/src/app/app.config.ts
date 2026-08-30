import {
  ApplicationConfig,
  inject,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideApollo } from "apollo-angular";
import { HttpLink } from "apollo-angular/http";
import { InMemoryCache } from "@apollo/client/core";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      return {
        link: httpLink.create({
          uri: "http://localhost:8080/graphql",
        }),
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            fetchPolicy: "network-only",
          },
        },
      };
    }),
  ],
};
