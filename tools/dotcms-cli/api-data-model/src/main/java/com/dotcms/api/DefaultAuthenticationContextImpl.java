package com.dotcms.api;


import com.dotcms.api.client.model.AuthenticationParam;
import com.dotcms.api.client.model.RestClientFactory;
import com.dotcms.api.client.model.ServiceManager;
import com.dotcms.model.ResponseEntityView;
import com.dotcms.model.annotation.SecuredPassword;
import com.dotcms.model.authentication.APITokenRequest;
import com.dotcms.model.authentication.TokenEntity;
import com.dotcms.model.config.CredentialsBean;
import com.dotcms.model.config.ServiceBean;
import io.quarkus.arc.All;
import io.quarkus.arc.DefaultBean;
import io.quarkus.runtime.StartupEvent;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;


@DefaultBean
@ApplicationScoped
public class DefaultAuthenticationContextImpl implements AuthenticationContext {

    @Inject
    @All
    List<ServiceManager> serviceManagers;

    ServiceManager serviceManager;

    @Inject
    RestClientFactory clientFactory;

    @Inject
    AuthenticationParam authenticationParam;

    private String user;

    private char[] token;

    @ConfigProperty(name = "com.dotcms.api.token.expiration", defaultValue = "10")
    Integer expirationDays;

    @PostConstruct
    void init(){
        //Always prefer a Service Manager that can securely keep passwords
        Optional<ServiceManager> optional = serviceManagers.stream().filter(manager -> {
            final SecuredPassword[] annotationsByType = manager.getClass().getAnnotationsByType(SecuredPassword.class);
            return annotationsByType.length > 0;
        }).findFirst();
        serviceManager = optional.orElseGet(() -> serviceManagers.get(0));
    }

    @Override
    public Optional<String> getUser() {
        return Optional.ofNullable(user);
    }

    @Override
    public Optional<char[]> getToken() {

        //This injects the token from the command line if present
        final Optional<char[]> paramToken = authenticationParam.getToken();
        if(paramToken.isPresent()){
            return paramToken;
        }
        //Otherwise we try to load it from the service manager
        final Optional<String> optionalUser = getUser();
        if (optionalUser.isPresent()) {
            if(null != token  && token.length > 0){
              return Optional.of(token);
            }
            final String userString = optionalUser.get();
            final Optional<char[]> optionalToken = loadToken(getServiceKey(), userString);
            optionalToken.ifPresent(s -> token = s);
            return optionalToken;
        }
        return Optional.empty();
    }

    @Override
    public void login(final String user, final char[] password) {
        final AuthenticationAPI api = clientFactory.getClient(AuthenticationAPI.class);
        final ResponseEntityView<TokenEntity> responseEntityView = api.getToken(
                APITokenRequest.builder().user(user).password(password)
                        .expirationDays(expirationDays).build());
        saveCredentials(user, responseEntityView.entity().token());
    }

    private void saveCredentials(final String user, final char[] token) {
        try {
            final ServiceBean serviceBean = ServiceBean.builder().active(true).name(getServiceKey())
                    .credentials(CredentialsBean.builder().user(user).token(token).build()).build();
            serviceManager.persist(serviceBean);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        this.user = user;
        this.token = token;
    }

    private Optional<char[]> loadToken(String serviceKey, String user) {

        final List<ServiceBean> profiles = serviceManager.services();
        final Optional<ServiceBean> optional = profiles.stream()
                .filter(serviceBean -> serviceKey.equals(serviceBean.name())).findFirst();
        if (optional.isPresent()) {
            final ServiceBean bean = optional.get();
            if (bean.credentials() != null  && user.equals(bean.credentials().user())) {
                return Optional.of(bean.credentials().token());
            }
        }
        return Optional.empty();
    }

    String getServiceKey() {
        final Optional<ServiceBean> selected = serviceManager.selected();
        if(selected.isEmpty()){
           throw new IllegalStateException("No dotCMS instance has been activated.");
        }
        return selected.get().name();
    }


    void onStart(@Observes StartupEvent ev) {
        serviceManager.selected().ifPresent(serviceBean -> {
            final CredentialsBean credentials = serviceBean.credentials();
            if(null != credentials){
              this.user = credentials.user();
              this.token = credentials.token();
            }
        });
    }

    public void reset(){
        this.user = null;
        if(null != this.token && this.token.length > 0){
             Arrays.fill(this.token,(char)0);
        }
        this.token = null;
    }

}
