function [x_opt, z_opt, info] = exact_setcover(A, costs, time_limit)
%EXACT_SETCOVER Resuelve el SCP por programación lineal entera (intlinprog).
%
%   min   c' * x
%   s.a.  A * x >= 1     (cada cliente cubierto al menos una vez)
%         x in {0,1}^N
%
% Entradas:
%   A           : matriz MxN binaria (filas=clientes, columnas=antenas)
%   costs       : vector 1xN de costos
%   time_limit  : (opcional) límite en segundos para intlinprog
%
% Salidas:
%   x_opt   : vector 0/1 de N elementos con la solución óptima
%   z_opt   : costo óptimo
%   info    : struct con status, gap, tiempo

    if nargin < 3, time_limit = 600; end

    [M, N] = size(A);
    f = costs(:);                   % minimizar f' * x
    intcon = 1:N;                   % todas las variables son enteras

    % intlinprog usa restricciones de la forma A_ineq * x <= b
    % Nosotros queremos A*x >= 1  ->  -A*x <= -1
    A_ineq = -double(A);
    b_ineq = -ones(M, 1);

    lb = zeros(N, 1);
    ub = ones(N, 1);

    opts = optimoptions('intlinprog', ...
        'Display', 'iter', ...
        'MaxTime', time_limit, ...
        'IntegerTolerance', 1e-6, ...
        'RelativeGapTolerance', 1e-6);

    t0 = tic;
    [x, fval, exitflag, output] = intlinprog(f, intcon, A_ineq, b_ineq, ...
        [], [], lb, ub, opts);
    elapsed = toc(t0);

    if isempty(x)
        error('intlinprog no encontró solución (exitflag=%d).', exitflag);
    end

    % Redondear por seguridad numérica
    x_opt = round(x);
    z_opt = costs(:)' * x_opt;

    % Verificar factibilidad
    cubiertos = double(A) * x_opt;
    if any(cubiertos < 1 - 1e-6)
        warning('Solución entregada por intlinprog no es factible.');
    end

    info = struct();
    info.exitflag = exitflag;
    info.status = exit_status(exitflag);
    info.elapsed_s = elapsed;
    info.relgap = output.relativegap;
    info.absgap = output.absolutegap;
    info.num_nodes = output.numnodes;
    info.num_selected = sum(x_opt);

    fprintf('\n=== MÉTODO EXACTO (intlinprog) ===\n');
    fprintf('  Estado          : %s\n', info.status);
    fprintf('  Antenas |S*|    : %d\n', info.num_selected);
    fprintf('  Costo óptimo z* : %.2f\n', z_opt);
    fprintf('  Tiempo (s)      : %.3f\n', elapsed);
    fprintf('  Gap relativo    : %.6f\n', info.relgap);
    fprintf('  Nodos B&B       : %d\n', info.num_nodes);
end

function s = exit_status(flag)
    switch flag
        case  1, s = 'Optimal';
        case  2, s = 'Stopped (time/relgap)';
        case  0, s = 'Stopped (max iterations)';
        case -1, s = 'Stopped by output function';
        case -2, s = 'Infeasible';
        case -3, s = 'Unbounded';
        otherwise, s = sprintf('flag=%d', flag);
    end
end
