package com.dotcms.cli.common;

public interface ExceptionHandler {

    Exception unwrap(Exception ex);

    Exception handle(Exception ex);

}
