package com.dotcms.cli.command;

import com.dotcms.api.AuthenticationContext;
import com.dotcms.api.UserAPI;
import com.dotcms.api.client.model.DotCmsClientConfig;
import com.dotcms.api.client.model.RestClientFactory;
import com.dotcms.api.client.model.ServiceManager;
import com.dotcms.cli.common.HelpOptionMixin;
import com.dotcms.cli.common.OutputOptionMixin;
import com.dotcms.model.annotation.SecuredPassword;
import com.dotcms.model.config.ServiceBean;
import com.dotcms.model.user.User;
import picocli.CommandLine;
import picocli.CommandLine.ExitCode;

import javax.enterprise.context.control.ActivateRequestContext;
import javax.inject.Inject;
import java.net.URI;
import java.util.Optional;
import java.util.concurrent.Callable;

@ActivateRequestContext
@CommandLine.Command(
        name = StatusCommand.NAME,
        header = {"@|bold,blue Provides Current User logged-in and dotCMS instance Status.|@"},
        description = {
                " This command provides a list with all the available dotCMS instance.",
                " The info includes API URL, active user and the current profile.",
                " This should give the user enough information to know which instance is active",
                " and which user is logged in.",
                "" // empty line left here on purpose to make room at the end
        })
public class StatusCommand implements Callable<Integer>, DotCommand {

    static final String NAME = "status";

    @CommandLine.Mixin(name = "output")
    protected OutputOptionMixin output;

    @CommandLine.Mixin
    HelpOptionMixin helpOption;

    @Inject
    @SecuredPassword
    ServiceManager serviceManager;

    @Inject
    RestClientFactory clientFactory;

    @Inject
    AuthenticationContext authenticationContext;

    @Inject
    DotCmsClientConfig clientConfig;

    @CommandLine.Spec
    CommandLine.Model.CommandSpec spec;

    @Override
    public Integer call() {

        // Checking for unmatched arguments
        output.throwIfUnmatchedArguments(spec.commandLine());

        final Optional<ServiceBean> optional = serviceManager.services().stream()
                .filter(ServiceBean::active).findFirst();

        if (optional.isEmpty()) {
            output.info(String.format(
                    " @|bold,underline,cyan No active profile is configured|@ Please use %s Command.",
                    InstanceCommand.NAME));
        } else {
            final ServiceBean serviceBean = optional.get();
            final String suffix = serviceBean.name();
            final URI uri = clientConfig.servers().get(suffix);
            if (null == serviceBean.credentials()) {
                output.info(String.format(
                        "Active instance is [@|bold,underline,blue %s|@] API is [@|bold,underline,blue %s|@] @|bold,underline No active user|@ Use %s Command.",
                        serviceBean.name(), uri, LoginCommand.NAME)
                );
            } else {

                output.info(String.format(
                        "Active instance is [@|bold,underline,blue %s|@] API is [@|bold,underline,blue %s|@] User [@|bold,underline,blue %s|@]",
                        serviceBean.name(), uri, serviceBean.credentials().user()));

                final Optional<String> userId = authenticationContext.getUser();
                if (userId.isEmpty()) {
                    output.info(
                            "@|bold,underline Current profile does not have a logged in user.|@");
                } else {
                    final Optional<char[]> token = authenticationContext.getToken();
                    if (token.isEmpty()) {
                        output.error(String.format(
                                "I did not find a valid token for saved user %s. Please login again.",
                                userId.get()));
                    } else {
                        try {
                            final UserAPI userAPI = clientFactory.getClient(UserAPI.class);
                            final User user = userAPI.getCurrent();
                            output.info(String.format("You're currently logged in as %s.", user.email()));
                            return ExitCode.OK;
                        } catch (Exception wae) {
                            return output.handleCommandException(wae, "Unable to get current user from API. Token could have expired. Please login again!");
                        }
                    }
                }
            }
        }
        return ExitCode.SOFTWARE;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public OutputOptionMixin getOutput() {
        return this.output;
    }
}
